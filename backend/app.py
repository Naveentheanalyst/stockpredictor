import os
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import GRU, Dense, Dropout

app = Flask(__name__)
# Enable CORS so the frontend (which might be hosted on GitHub Pages) can make requests to this backend
CORS(app)

def fetch_data(ticker, window_size=60):
    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(days=3*365)).strftime('%Y-%m-%d')
    
    df = yf.download(ticker, start=start_date, end=end_date, progress=False)
    if df.empty:
        raise ValueError("No data found for the given ticker.")
        
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    return df

def preprocess_and_train(df, epochs, window_size=60):
    data = df.filter(['Close']).values
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    x_train, y_train = [], []
    for i in range(window_size, len(scaled_data)):
        x_train.append(scaled_data[i-window_size:i, 0])
        y_train.append(scaled_data[i, 0])
        
    x_train, y_train = np.array(x_train), np.array(y_train)
    x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))
    
    # Build GRU Model
    model = Sequential()
    model.add(GRU(units=50, return_sequences=True, input_shape=(x_train.shape[1], 1)))
    model.add(Dropout(0.2))
    model.add(GRU(units=50, return_sequences=False))
    model.add(Dropout(0.2))
    model.add(Dense(units=25, activation='relu'))
    model.add(Dense(units=1))
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    
    # Train
    history = model.fit(x_train, y_train, batch_size=32, epochs=epochs, verbose=0)
    
    # Predict next day
    last_window = scaled_data[-window_size:]
    x_test = np.reshape(last_window, (1, window_size, 1))
    pred_scaled = model.predict(x_test, verbose=0)
    pred_unscaled = scaler.inverse_transform(pred_scaled)
    
    return pred_unscaled[0][0], history.history['loss'][-1]

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        req_data = request.json
        ticker = req_data.get('ticker', 'RELIANCE.NS')
        epochs = int(req_data.get('epochs', 5))
        
        # 1. Fetch
        df = fetch_data(ticker)
        
        # 2. Train & Predict
        next_day_price, final_loss = preprocess_and_train(df, epochs=epochs)
        
        # 3. Format payload
        dates = df.index.strftime('%Y-%m-%d').tolist()
        prices = df['Close'].tolist()
        
        return jsonify({
            'success': True,
            'ticker': ticker,
            'latest_price': float(prices[-1]),
            'latest_date': dates[-1],
            'next_day_prediction': float(next_day_price),
            'model_loss': float(final_loss),
            'dates': dates,
            'prices': [float(p) for p in prices]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    # Run server locally
    app.run(host='0.0.0.0', port=5001, debug=True)
