// Ensure Chart.js is loaded BEFORE this script.
// Example: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

// --- Sidebar Functionality ---
const sidebar = document.getElementById('sidebar');
let isOpen = window.innerWidth >= 1024; // Open by default on large screens

function toggleSidebar() {
    isOpen = !isOpen;
    if (sidebar) { // Check if sidebar element exists
        sidebar.classList.toggle('open', isOpen);
        sidebar.classList.toggle('closed', !isOpen);
    }
    const mainContent = document.querySelector('.content-container'); // Changed from .main-content to .content-container
    if (mainContent) {
        // Only apply ml-64 if sidebar is open AND screen is NOT large (i.e., small/medium screens)
        mainContent.classList.toggle('ml-64', isOpen && window.innerWidth >= 1024); // Applied ml-64 on large screens when open
    }
}

function handleMenuItemClick() {
    if (window.innerWidth < 1024) {
        toggleSidebar();
    }
}

function handleClickOutside(event) {
    if (isOpen && window.innerWidth < 1024 &&
        sidebar && // Check if sidebar element exists
        !sidebar.contains(event.target) &&
        !event.target.closest('.sidebar-toggle')) { // Assuming you have a toggle button with this class
        toggleSidebar();
    }
}

// Add event listener for clicks outside the sidebar
document.addEventListener('mousedown', handleClickOutside);

// Adjust layout on window resize
window.addEventListener('resize', () => {
    // Re-evaluate isOpen based on current screen size
    if (window.innerWidth >= 1024) {
        isOpen = true; // Sidebar should be open on large screens
        if (sidebar) {
            sidebar.classList.add('open');
            sidebar.classList.remove('closed');
        }
    } else {
        isOpen = false; // Sidebar should be closed by default on small screens
        if (sidebar) {
            sidebar.classList.add('closed');
            sidebar.classList.remove('open');
        }
    }

    const mainContent = document.querySelector('.content-container'); // Changed from .main-content to .content-container
    if (mainContent) {
        // Always apply ml-64 on large screens, remove on small screens
        mainContent.classList.toggle('ml-64', window.innerWidth >= 1024);
    }
});

// --- Chart.js Functionality ---
let weeklyBarChart; // Declare a variable to hold the chart instance

function setupCharts() {
    const barCanvas = document.getElementById('weeklyChart');
    if (barCanvas) {
        const barChartContext = barCanvas.getContext('2d');

        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const weeklyStepsData = JSON.parse(localStorage.getItem("weeklySteps")) || {};
        const weeklyCaloriesData = JSON.parse(localStorage.getItem("weeklyCalories")) || {};
        
        const currentWeekSteps = new Array(7).fill(0);
        const currentWeekCalories = new Array(7).fill(0);

        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Calculate the difference to get to Monday of the CURRENT week
        // If today is Sunday (0), we need to go back 6 days to get to the Monday of THIS week.
        // Otherwise, subtract (dayOfWeek - 1) days to get to Monday.
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get to Monday
        const mondayOfThisWeek = new Date(today); // Create a new Date object to avoid modifying 'today' directly
        mondayOfThisWeek.setDate(today.getDate() - diffToMonday);
        mondayOfThisWeek.setHours(0, 0, 0, 0); // Normalize to start of day

        labels.forEach((dayLabel, index) => {
            const currentDayDate = new Date(mondayOfThisWeek);
            currentDayDate.setDate(mondayOfThisWeek.getDate() + index); // This adds 0 for Mon, 1 for Tue, etc.
            const year = currentDayDate.getFullYear();
            const month = String(currentDayDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
            const day = String(currentDayDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            console.log(`Chart label: ${dayLabel}, Corresponds to date: ${currentDayDate.toLocaleDateString()}, Data key: ${dateKey}`);
            if (weeklyStepsData[dateKey]) {
                currentWeekSteps[index] = weeklyStepsData[dateKey];
            }
            if (weeklyCaloriesData[dateKey]) {
                currentWeekCalories[index] = weeklyCaloriesData[dateKey];
            }
        });

        // Destroy existing chart instance if it exists to prevent overlap
        if (weeklyBarChart) {
            weeklyBarChart.destroy();
        }

        weeklyBarChart = new Chart(barChartContext, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Steps',
                        data: currentWeekSteps,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderRadius: 6,
                        maxBarThickness: 40
                    },
                    {
                        label: 'Calories',
                        data: currentWeekCalories, // Use dynamically populated calories data
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderRadius: 6,
                        maxBarThickness: 40
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#555',
                            font: { size: 12, weight: '600' }
                        },
                        title: {
                            display: true,
                            text: 'Count',
                            color: '#555',
                            font: { size: 14, weight: '700' }
                        },
                        grid: { color: '#eee' }
                    },
                    x: {
                        ticks: {
                            color: '#555',
                            font: { size: 13, weight: '600' }
                        },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 14, weight: '700' },
                            color: '#444'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleFont: { size: 14, weight: '700' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        console.error('Error: Bar chart canvas (#weeklyChart) not found.');
    }
}

// Helper function to calculate steps based on workout type and duration
function calculateSteps(workoutType, duration) {
    const workoutTypeLower = workoutType.toLowerCase();
    let steps = 0;

    if (workoutTypeLower === 'running') {
        steps = duration * 100;
    } else if (workoutTypeLower === 'leg || core') {
        steps = duration * 80;
    } else if (workoutTypeLower === 'waiking || jogging') {
        steps = duration * 60;
    } else {
        steps = duration * 70; // Default for other types
    }
    return steps;
}

// Helper function to calculate calories (simplified example, you'd use a more accurate formula)
function calculateCalories(workoutType, duration) {
    const workoutTypeLower = workoutType.toLowerCase();
    let calories = 0;

    if (workoutTypeLower === 'running') {
        calories = duration * 10; // Example: 10 calories per minute
    } else if (workoutTypeLower === 'walking') {
        calories = duration * 5;  // Example: 5 calories per minute
    } else if (workoutTypeLower === 'cycling') {
        calories = duration * 8;  // Example: 8 calories per minute
    } else {
        calories = duration * 7;  // Default
    }
    return calories;
}


// --- Form Functionality (assuming this is on workout.html or similar) ---
// This function will handle user input for new workouts.
// We'll call it if the 'calculation-form' exists.
function setupForm() {
    const form = document.getElementById('calculation-form');

    if (form) {
        // Correctly target input fields, assuming IDs like 'workout-type-input', 'duration-input'
        const workoutTypeInput = document.getElementById('workout-type');
        const durationInput = document.getElementById('duration');
        const stepsInput = document.getElementById('steps'); // Assuming an input for steps on workout.html
        const caloriesInput = document.getElementById('calories'); // Assuming an input for calories on workout.html
        const calculateBtn = document.getElementById('calculate-btn');
        // No need for backToHomeBtn or resultsDiv on index.html as these are for workout.html form submission results

        // Helper to save current form data
        const saveFormData = () => {
            const formData = {
                workoutType: workoutTypeInput ? workoutTypeInput.value : '',
                duration: durationInput ? durationInput.value : '',
                steps: stepsInput ? stepsInput.value : '',
                calories: caloriesInput ? caloriesInput.value : '',
            };
            localStorage.setItem('currentWorkoutFormData', JSON.stringify(formData)); // Use a different key for current form data
        };

        // Add event listeners to input fields to save data on change
        if (workoutTypeInput) workoutTypeInput.addEventListener('input', saveFormData);
        if (durationInput) durationInput.addEventListener('input', saveFormData);
        if (stepsInput) stepsInput.addEventListener('input', saveFormData);
        if (caloriesInput) caloriesInput.addEventListener('input', saveFormData);

        calculateBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default form submission

            const workoutType = workoutTypeInput.value.trim();
            const duration = parseInt(durationInput.value);
            // We can calculate steps and calories here instead of relying solely on input fields
            const calculatedSteps = calculateSteps(workoutType, duration);
            const calculatedCalories = calculateCalories(workoutType, duration);

            // Use the calculated values to update the form's steps/calories input if they exist
            if (stepsInput) stepsInput.value = calculatedSteps;
            if (caloriesInput) caloriesInput.value = calculatedCalories;

            if (!workoutType || isNaN(duration)) {
                alert('Please fill at least workout type and duration.');
                return;
            }

            // --- Update overall dashboard display values (if on index.html, or just pass to displayStoredFormData) ---
            // If this form is on workout.html, these updates would typically go to a results section on that page.
            // For the dashboard, we'll ensure displayStoredFormData pulls from localStorage after this.

            // Store daily step and calorie data consistently
            const todayFormatted = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // Update weekly steps
            const weeklySteps = JSON.parse(localStorage.getItem('weeklySteps')) || {};
            weeklySteps[todayFormatted] = (weeklySteps[todayFormatted] || 0) + calculatedSteps; // Add to existing steps for today
            localStorage.setItem('weeklySteps', JSON.stringify(weeklySteps));

            // Update weekly calories
            const weeklyCalories = JSON.parse(localStorage.getItem('weeklyCalories')) || {};
            weeklyCalories[todayFormatted] = (weeklyCalories[todayFormatted] || 0) + calculatedCalories; // Add to existing calories for today
            localStorage.setItem('weeklyCalories', JSON.stringify(weeklyCalories));

            // Re-render charts and dashboard display with new data
            setupCharts();
            displayStoredFormData(); // Call this to update the dashboard's individual step/calorie displays
            
            alert('Workout data saved and dashboard updated!'); // User feedback
            // Optionally clear the form after submission
            form.reset();
            localStorage.removeItem('currentWorkoutFormData'); // Clear temporary form data
        });
    }
}

// This function is responsible for displaying the *current day's* stored step and calorie data
// on the dashboard summary cards.
function displayStoredFormData() {
    // Get today's date in YYYY-MM-DD format for consistent lookup
    const todayFormatted = new Date().toISOString().split('T')[0];

    const weeklyStepsData = JSON.parse(localStorage.getItem('weeklySteps')) || {};
    const weeklyCaloriesData = JSON.parse(localStorage.getItem('weeklyCalories')) || {};

    const stepsToday = weeklyStepsData[todayFormatted] || 0;
    const caloriesToday = weeklyCaloriesData[todayFormatted] || 0;

    const stepValueElement = document.getElementById('stepValue');
    const stepPercentageElement = document.getElementById('stepPercentage');
    const calorieValueElement = document.getElementById('calorieValue');

    if (stepValueElement) {
        stepValueElement.textContent = `${stepsToday.toLocaleString()} steps`;
    }

    const goalSteps = 5000; // Define your daily step goal
    const stepPercent = Math.min((stepsToday / goalSteps) * 100, 100);
    if (stepPercentageElement) {
        stepPercentageElement.textContent = `${Math.round(stepPercent)}% of your goals`;
    }

    if (calorieValueElement) {
        calorieValueElement.textContent = `${caloriesToday.toLocaleString()} kcl`;
    }
}


// --- Initialize when DOM is ready ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup for sidebar on page load
    if (sidebar) {
        if (isOpen) {
            sidebar.classList.add('open');
            sidebar.classList.remove('closed');
        } else {
            sidebar.classList.add('closed');
            sidebar.classList.remove('open');
        }
    }
    const mainContent = document.querySelector('.content-container'); // Changed from .main-content to .content-container
    if (mainContent) {
        mainContent.classList.toggle('ml-64', isOpen && window.innerWidth >= 1024); // Initial margin for large screens
    }

    // Call setupCharts() and displayStoredFormData() after the DOM is fully loaded
    setupCharts();
    displayStoredFormData(); // Populate the summary cards
    setupForm(); // Initialize form handling if it exists on the page
});