document.addEventListener('DOMContentLoaded', () => {
    const predictBtn = document.getElementById('predictBtn');
    const tickerInput = document.getElementById('tickerInput');
    const epochsInput = document.getElementById('epochsInput');
    const statusBox = document.getElementById('statusBox');
    const statusText = document.getElementById('statusText');
    const resultsContainer = document.getElementById('resultsContainer');
    const chartWrapper = document.getElementById('chartWrapper');
    
    let myChart = null;

    // Change this to your deployed backend URL once deployed (e.g. Render, Heroku)
    const BACKEND_URL = 'http://localhost:5001/api/predict';

    predictBtn.addEventListener('click', async () => {
        const ticker = tickerInput.value.toUpperCase().trim();
        const epochs = parseInt(epochsInput.value);

        if (!ticker) {
            alert('Please enter a stock ticker!');
            return;
        }

        try {
            // UI Setup
            predictBtn.disabled = true;
            statusBox.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            chartWrapper.classList.add('hidden');

            updateStatus(`Sending request to Python Backend. Training GRU Model for ${ticker}... (This may take a minute)`);
            
            // Fetch prediction from Python Backend
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ticker: ticker, epochs: epochs })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to train model and fetch prediction.");
            }

            const { 
                latest_price, 
                latest_date, 
                next_day_prediction, 
                model_loss,
                dates,
                prices
            } = data;

            const priceDiff = next_day_prediction - latest_price;

            // Update UI
            document.getElementById('latestCloseValue').innerText = `₹${latest_price.toFixed(2)}`;
            document.getElementById('latestCloseDate').innerText = `Date: ${latest_date}`;
            
            document.getElementById('predictedValue').innerText = `₹${next_day_prediction.toFixed(2)}`;
            
            const deltaEl = document.getElementById('predictedDelta');
            deltaEl.innerText = `${priceDiff >= 0 ? '+' : ''}₹${priceDiff.toFixed(2)} (${((priceDiff/latest_price)*100).toFixed(2)}%)`;
            deltaEl.className = `delta ${priceDiff >= 0 ? 'positive' : 'negative'}`;

            document.getElementById('modelLossValue').innerText = model_loss.toFixed(6);

            // Draw Chart
            updateStatus('Rendering visualizations...');
            drawChart(dates, prices, next_day_prediction);

            // Finish
            statusBox.classList.add('hidden');
            resultsContainer.classList.remove('hidden');
            chartWrapper.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
            statusBox.classList.add('hidden');
        } finally {
            predictBtn.disabled = false;
        }
    });

    function updateStatus(message) {
        statusText.innerText = message;
    }

    function drawChart(dates, actualPrices, nextDayPrediction) {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        if (myChart) {
            myChart.destroy();
        }

        // We'll show the last 150 days to make the chart readable
        const displayLength = Math.min(150, actualPrices.length);
        const plotDates = dates.slice(-displayLength);
        const plotPrices = actualPrices.slice(-displayLength);

        // Add the future predicted date
        const lastDate = new Date(plotDates[plotDates.length - 1]);
        lastDate.setDate(lastDate.getDate() + 1);
        const nextDateStr = lastDate.toISOString().split('T')[0];
        
        plotDates.push(`(Pred) ${nextDateStr}`);
        
        // Pad actual prices array with a null so lines connect visually
        const predictedSeries = new Array(plotPrices.length - 1).fill(null);
        predictedSeries.push(plotPrices[plotPrices.length - 1]); // Connect to last actual
        predictedSeries.push(nextDayPrediction);
        
        plotPrices.push(null); // Actual ends here

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: plotDates,
                datasets: [
                    {
                        label: 'Historical Price',
                        data: plotPrices,
                        borderColor: '#2997ff', // Apple Blue
                        backgroundColor: 'rgba(41, 151, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.2,
                        fill: true,
                        pointRadius: 0
                    },
                    {
                        label: 'Projected Projection',
                        data: predictedSeries,
                        borderColor: '#ff9f0a', // Apple Orange
                        borderWidth: 3,
                        borderDash: [6, 6],
                        pointBackgroundColor: '#ff9f0a',
                        pointRadius: [ ...new Array(predictedSeries.length - 1).fill(0), 6 ] // Only show dot on last point
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#86868b', font: { family: '-apple-system' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#86868b', maxTicksLimit: 10, font: { family: '-apple-system' } }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#f5f5f7', font: { family: '-apple-system', size: 13 } }
                    }
                }
            }
        });
    }
});
