import { createCanvas } from 'canvas';
import Chart from 'chart.js/auto';

export async function generateBarChart(labels, data, title) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    return canvas.toBuffer();
}
