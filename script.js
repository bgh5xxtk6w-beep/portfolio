import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsmW52YN6KVcrDdRB87YLJKS51_6Z96Co",
  authDomain: "archeo-vortex.firebaseapp.com",
  projectId: "archeo-vortex",
  storageBucket: "archeo-vortex.firebasestorage.app",
  messagingSenderId: "1088760597130",
  appId: "1:1088760597130:web:a4e3907a79bee5c7f33b73",
  measurementId: "G-BPK8QL50CV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Structure Default
    let surveyData = {
        innovation: [8, 9, 10, 8, 9], // fallback/initial
        utility: [9, 10, 9, 8, 10],
        recommendation: [10, 9, 10, 9, 10],
        components: {
            'ESP32': 2,
            'Motors': 1,
            'Hx711': 0,
            'Mosfet': 1,
            'Other': 1
        }
    };

    const calculateAverage = (arr) => {
        if (!arr || arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return parseFloat((sum / arr.length).toFixed(1));
    };

    const updateStats = () => {
        document.getElementById('statTotalResponses').innerText = surveyData.innovation.length;
        
        const avgInn = calculateAverage(surveyData.innovation);
        const avgUtil = calculateAverage(surveyData.utility);
        const avgRec = calculateAverage(surveyData.recommendation);
        
        const totalAvg = ((avgInn + avgUtil + avgRec) / 3).toFixed(1);
        document.getElementById('statAvgScore').innerText = `${totalAvg} / 10`;
    };

    // 2. Initialize Charts (Light Theme Adjustments)
    Chart.defaults.color = '#475569'; // text-muted for light bg
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Bar Chart
    const ctxBar = document.getElementById('barChart').getContext('2d');
    let barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Innovation', 'Real-world Utility', 'Recommendation'],
            datasets: [{
                label: 'Average Score',
                data: [
                    calculateAverage(surveyData.innovation), 
                    calculateAverage(surveyData.utility),
                    calculateAverage(surveyData.recommendation)
                ],
                backgroundColor: [
                    'rgba(14, 165, 233, 0.7)',
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(225, 29, 72, 0.7)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 10, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Radar Chart
    const ctxRadar = document.getElementById('radarChart').getContext('2d');
    let radarChart = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['Innovation', 'Utility', 'Recommendation'],
            datasets: [{
                label: 'Score Spread',
                data: [
                    calculateAverage(surveyData.innovation), 
                    calculateAverage(surveyData.utility),
                    calculateAverage(surveyData.recommendation)
                ],
                backgroundColor: 'rgba(14, 165, 233, 0.2)',
                borderColor: 'rgba(14, 165, 233, 1)',
                pointBackgroundColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(0,0,0,0.1)' },
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    pointLabels: { color: '#0f172a', font: { size: 12 } },
                    ticks: { display: false, max: 10, min: 0 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Pie Chart
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    let pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(surveyData.components),
            datasets: [{
                data: Object.values(surveyData.components),
                backgroundColor: [
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(225, 29, 72, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#0f172a', padding: 15 } }
            },
            cutout: '65%'
        }
    });

    updateStats();

    // 3. Real-time Firebase Listener
    const responsesCol = collection(db, 'survey_responses');
    onSnapshot(responsesCol, (snapshot) => {
        if (!snapshot.empty) {
            // Reset counts when reading live data
            let freshData = {
                innovation: [], utility: [], recommendation: [],
                components: { 'ESP32': 0, 'Motors': 0, 'Hx711': 0, 'Mosfet': 0, 'Other': 0 }
            };

            snapshot.forEach((doc) => {
                const data = doc.data();
                if(data.innovation) freshData.innovation.push(data.innovation);
                if(data.utility) freshData.utility.push(data.utility);
                if(data.recommendation) freshData.recommendation.push(data.recommendation);
                if(data.favoriteComponent && freshData.components[data.favoriteComponent] !== undefined) {
                    freshData.components[data.favoriteComponent]++;
                }
            });

            // Update main state and charts
            surveyData = freshData;
            
            const newAverages = [
                calculateAverage(surveyData.innovation),
                calculateAverage(surveyData.utility),
                calculateAverage(surveyData.recommendation)
            ];

            barChart.data.datasets[0].data = newAverages;
            barChart.update();

            radarChart.data.datasets[0].data = newAverages;
            radarChart.update();

            pieChart.data.datasets[0].data = Object.values(surveyData.components);
            pieChart.update();

            updateStats();
        }
    });

    // 4. Handle Form Submission
    const form = document.getElementById('surveyForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const nameVal = document.getElementById('name').value;
        const innoVal = parseInt(document.getElementById('innovation').value, 10);
        const utilVal = parseInt(document.getElementById('utility').value, 10);
        const recVal = parseInt(document.getElementById('recommendation').value, 10);
        const compVal = document.getElementById('favoriteComponent').value;
        const feedVal = document.getElementById('feedback').value;

        if (innoVal >= 1 && innoVal <= 10 && utilVal >= 1 && utilVal <= 10 && recVal >= 1 && recVal <= 10 && compVal) {
            
            try {
                // Save to Firestore
                await addDoc(collection(db, 'survey_responses'), {
                    name: nameVal,
                    innovation: innoVal,
                    utility: utilVal,
                    recommendation: recVal,
                    favoriteComponent: compVal,
                    feedback: feedVal,
                    timestamp: new Date()
                });

                // Reset form and alert user
                form.reset();
                alert('Awesome! Your feedback has been sent to the cloud.');
                
                // Scroll to results
                document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error("Error writing document: ", error);
                alert("Error saving your response. Please try again.");
            }
        } else {
            alert('Please fill out all fields correctly.');
        }
    });

    // 5. Navbar scroll effect (Light Theme)
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '0.5rem 4rem';
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.padding = '1rem 4rem';
            navbar.style.background = 'rgba(248, 250, 252, 0.85)';
            navbar.style.boxShadow = 'none';
        }
    });
});
