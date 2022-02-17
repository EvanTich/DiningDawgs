const halls = ["bolton", "ohouse", "snelling", "summit", "scott", "all"];
const halls_pretty = ["Bolton", "O-House", "Snelling", "Joe Frank", "The Niche", "All Halls"];
const hall_colors = ["rgb(117, 138, 255)", "rgb(237, 176, 71)", "rgb(150, 17, 17)", "rgb(255, 248, 117)", "rgb(76, 166, 97)"];

// inputs
const hallSelector = document.getElementById("hallSelector");
const dateInput = document.getElementById("dateInput");

// fallback selectors
const yearInput = document.getElementById("yearInput");
const monthSelector = document.getElementById("monthSelector");
const daySelector = document.getElementById("daySelector");

// notification boxes
const messageBox = document.getElementById("message");
const lastUpdatedBox = document.getElementById("lastUpdated");

var barChart;
var lineChart;

const dateSupported = (function() {
    let test = document.createElement('input');
    test.type = 'date';
    return test.type !== 'text';
})();

// current time in HH:MM AM/PM format
function getTime(date) {
    return `${date.getHours() == 0 ? 12 : pad(date.getHours() > 12 ? date.getHours() - 12 : date.getHours())}:${pad(date.getMinutes())} ${date.getHours() < 12 ? "AM" : "PM"}`;
}

function daysInMonth(month) {
    return new Date(2019, month, 0).getDate();
}

function pad(i) {
    return `${i < 10 ? '0' : ''}${i}`; // pad with 0 if needed
}

function selectNow() {
    let now = new Date(); // todays date
    let year = now.getFullYear(),
        month = pad(now.getMonth() + 1), // 0 is jan, but our jan is 1
        day = pad(now.getDate());

    if(dateSupported) {
        dateInput.value = `${year}-${month}-${day}`;
    } else {
        yearInput.value = year;
        monthSelector.value = month;
        daySelector.value = day;
    }
}

function get(url) {
    return fetch(url).then(r => r.json());
}

function getBarGraphData() {
    /*
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * Note to anybody thinking about using this data:     *
    // * --> please do not call an excessive amount of times.*
    // *     Thanks!                                         *
    // * p.s. we only have the free version of firebase :)   *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    */
    let promise = new Promise(resolve => {
        get('https://dining-capacity.firebaseio.com/data/last_update.json').then(lastUpdate => {
            let date = new Date(lastUpdate.time * 1000);
            // change last update box
            lastUpdatedBox.innerHTML = `Latest Update: ${getTime(date)}`;

            let promises = [];
            for(let i = 0; i < halls.length - 1; i++) {
                promises.push(get(lastUpdate.url.replace('{}', halls[i]))); 
            }

            Promise.all(promises).then(actual => {
                resolve(actual);
            });
        });
    });

    return promise;
}

function getLineGraphData(hall, year, month, day) {
    /*
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * Note to anybody thinking about using this data:     *
    // * --> please do not call an excessive amount of times.*
    // *     Thanks!                                         *
    // * p.s. we only have the free version of firebase :)   *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    */
    let promise = new Promise(resolve => {
        let points = [];
        get(`https://dining-capacity.firebaseio.com/data/${hall}/${year}/${month}/${day}.json`).then(hours => {
            if(hours == null) {
                messageBox.innerHTML = 'No data on the selected date!'; // TODO: add more info
                resolve(points);
                return;
            } else messageBox.innerHTML = '';

            for(let hour in hours) {
                let mins = hours[hour];
                for(let min in mins) {
                    let date = new Date(year, month, day, hour, min);
                    points.push({x: date, y: mins[min], tooltip: getTime(date)});
                }
            }

            points.sort( (a, b) => a.x - b.x);

            resolve(points);
        });
    });

    return promise;
}

function set(dataPoints, data) {
    dataPoints.splice(0, dataPoints.length);
    data.forEach(d => dataPoints.push(d));
}

function updateBarGraph() {
    getBarGraphData().then(bar => {
        set(barChart.data.datasets[0].data, bar);
        barChart.update();
    });
}

function getHallData(hall, callback) {
    let year, month, day;
    if(dateSupported) {
        [year, month, day] = dateInput.value.split("-");
    } else {
        year = yearInput.value;
        month = monthSelector.value;
        day = daySelector.value;
    }

    getLineGraphData(hall, year, month, day)
        .then(callback);
}

function updateLineGraph() {
    if(hallSelector.value == "all") {
        lineChart.data.datasets[0].label = halls_pretty[0];
        lineChart.options.legend.display = true;
        for(let i = 0; i < 5; i++) {
            lineChart.data.datasets[i].hidden = false;
            getHallData(halls[i], data => {
                set(lineChart.data.datasets[i].data, data);
                lineChart.update();
            });
        }
    } else {
        lineChart.options.legend.display = false;
        for(let i = 1; i < 5; i++) {
            lineChart.data.datasets[i].hidden = true;
        }

        lineChart.data.datasets[0].label = halls_pretty[hallSelector.selectedIndex];
        getHallData(hallSelector.value, data => {
            set(lineChart.data.datasets[0].data, data);
            lineChart.update();
        });
    }
}

function update() {
    updateBarGraph();
    // if on current day, update
    let selected;
    if(dateSupported) {
        let [year, month, day] = dateInput.value.split("-");
        selected = new Date(year, month - 1, day); // why are months indexed?
    } else {
        selected = new Date(yearInput.value, monthSelector.value - 1, daySelector.value);
    }

    if(new Date().toDateString() === selected.toDateString()) {
        updateLineGraph();
    }
}

function changedMonth() {
    // hide days in day selector that dont make sense
    let days = daysInMonth(parseInt(monthSelector.value));

    if(daySelector.value > days)
        daySelector.value = days;

    // dont allow an option if that day does not exist on the calendar
    for(let option of daySelector.options) {
        option.disabled = parseInt(option.value) > days;
    }

    updateLineGraph();
}

function drawLabels() {
    let chart = this.chart;
    let ctx = chart.ctx;
    ctx.font = '20px Helvetica'; // this is fine
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    this.data.datasets.forEach((dataset, i) => {
        let meta = chart.controller.getDatasetMeta(i);
        meta.data.forEach((bar, index) => {
            let y = bar._model.y + (dataset.data[index] < 10 ? -5 : ((bar._view.base - bar._view.y) / 2 + 5));
            ctx.fillText(dataset.data[index] + '%', bar._model.x, y);
        });
    });
}

window.onload = () => {
    if(!dateSupported) {
        // hide date picker input, show the selectors
        document.getElementById("fallback").style.display = "";
        document.getElementById("dateSupported").style.display = "none";

        // add the days on the day selector, 1 to 31
        for(let i = 1; i < 32; i++) {
            let option = document.createElement("option");
            option.text = i.toString();
            option.value = pad(i);
            daySelector.add(option);
        }
    }

    // add the halls to the hall selector
    for(let i = 0; i < halls.length; i++) {
        let option = document.createElement("option");
        option.text = halls_pretty[i];
        option.value = halls[i];
        hallSelector.add(option);
    }

    selectNow();

    barChart = new Chart('barContainer', {
        type: 'bar',
        data: {
            labels: [...halls_pretty].splice(0, halls_pretty.length - 1), // copy hall names to labels
            datasets: [{
                label: '# of Votes',
                data: [],
                // bonus green to red color changer based on value, which is sadly unused... ;(
                // backgroundColor: context => {
                // 	let value = context.dataset.data[context.dataIndex];
                // 	const max = 90;
                // 	const min = 25;
                // 	return `hsla(${value <= min ? 120 : (value >= max ? 0 : ((1 - (value - min) / (max - min)) * 120))}, 100%, 45%, 1)`;
                // },
                backgroundColor: hall_colors,
                borderColor: hall_colors,
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Current Occupancy'
            },
            legend: {
                display: false
            },
            tooltips: {
                enabled: true,
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: (item, data) => {
                        return `${item.label}: ${item.value}%`;
                    }
                }
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Dining Halls'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Occupancy (%)'
                    },
                    ticks: {
                        max: 100,
                        beginAtZero: true
                    }
                }]
            },
            hover: { // no tooltip animation, fixes floating labels
                animationDuration: 0
            },
            animation: {
                duration: 500, // in ms
                // test with: var asda = 0; setInterval(() => {barChart.data.datasets[0].data[0] = (asda = asda % 100 + 5); barChart.update();}, 1500);
                onProgress: drawLabels,
                onComplete: drawLabels
            }
        }
    });

    lineChart = new Chart('lineContainer', {
        type: 'scatter', // its a line plot, trust me
        data: {
            datasets: [{
                label: halls_pretty[0],
                showLine: true,
                fill: false,
                borderColor: hall_colors[0],
                data: []
            },{
                label: halls_pretty[1],
                showLine: true,
                fill: false,
                borderColor: hall_colors[1],
                data: []
            },{
                label: halls_pretty[2],
                showLine: true,
                fill: false,
                borderColor: hall_colors[2],
                data: []
            },{
                label: halls_pretty[3],
                showLine: true,
                fill: false,
                borderColor: hall_colors[3],
                data: []
            },{
                label: halls_pretty[4],
                showLine: true,
                fill: false,
                borderColor: hall_colors[4],
                data: []
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Past Occupancy'
            },
            legend: {
                display: true
            },
            elements: {
                point: {
                    radius: 0,
                    hitRadius: 4
                },
                line: { // no smoothing
                    tension: 0
                }
            },
            animation: { // no animation
                duration: 0
            },
            hover: { // no tooltip animation
                animationDuration: 0
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
            tooltips: {
                enabled: true,
                intersect: false,
                mode: 'index',
                displayColors: false,
                callbacks: {
                    title: (item, data) => {
                        return data.datasets[item[0].datasetIndex].data[item[0].index].tooltip;
                    },
                    label: (item, data) => {
                        return `${data.datasets[item.datasetIndex].label}: ${item.value}%`;
                    }
                }
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Occupancy (%)'
                    },
                    ticks: {
                        max: 100,
                        beginAtZero: true
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    },
                    type: 'time',
                    position: 'bottom'
                }]
            }
        }
    });

    update();

    // wait until 10s after the last expected update (time % 5min == 0) to start updating regularly
    const SLEEP = 300000;
    setTimeout( () => {
        // initial update
        update();
        // every other update
        setInterval(update, SLEEP);
    }, SLEEP - (Date.now() % SLEEP) + 10000);
};
