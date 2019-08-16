const halls = ["bolton", "ohouse", "snelling", "summit", "scott"];
const halls_pretty = ["Bolton", "O-House", "Snelling", "Joe Frank", "The Niche"];

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

const dateSupported = isDateSupported();

function isDateSupported() {
    // thanks to chris@gomakethings.com for this snippet of code
	var input = document.createElement('input');
	var value = 'a';
	input.setAttribute('type', 'date');
	input.setAttribute('value', value);
	return input.value !== value;
}

// current time in HH:MM AM/PM format
function getTime(date) {
    return `${pad(date.getHours() > 12 ? date.getHours() - 12 : date.getHours())}:${pad(date.getMinutes())} ${date.getHours() < 12 ? "AM" : "PM"}`;
}

function daysInMonth(month) {
    return new Date(2019, month, 0).getDate();
}

function pad(i) {
    return `${i < 10 ? "0" : ""}${i}`; // pad with 0 if needed
}

function selectNow() {
    let now = new Date(); // todays date
    let year = now.getFullYear(),
        month = pad(now.getMonth() + 1), // 0 is jan, but our jan is 1
        day = pad(now.getDate());

    dateInput.value = `${year}-${month}-${day}`;
    
    yearInput.value = year;
    monthSelector.value = month;
    daySelector.value = day;
}

function get(url) {
    let req = new XMLHttpRequest(); // a new request
    req.open("GET", url, false);
    req.send(null);
    
    return req.responseText;
}

function getBarGraphData() {
    let actual = [];
    let invert = [];
    
    /*
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * Note to anybody thinking about using this data:     *
    // * --> please do not call an excessive amount of times.*
    // *     Thanks!                                         *
    // * p.s. we only have the free version of firebase :)   *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    */
    let lastUpdate = JSON.parse(get("https://dining-capacity.firebaseio.com/data/last_update.json"));
    let date = new Date(lastUpdate.time * 1000);
    // change last update box
    lastUpdatedBox.innerHTML = `Latest Update: ${getTime(date)}`;

    for(let i = 0; i < halls.length; i++) {
        let url = lastUpdate.url.replace("{}", halls[i]);
        let percent = parseInt(get(url));
        
        actual.push({label: halls_pretty[i], y: percent});
        invert.push({label: halls_pretty[i], y: 100 - percent});
    }
    
    return [actual, invert];
}

function getLineGraphData(hall, year, month, day) {
    let points = [];
    /*
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    // * Note to anybody thinking about using this data:     *
    // * --> please do not call an excessive amount of times.*
    // *     Thanks!                                         *
    // * p.s. we only have the free version of firebase :)   *
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    */
    let data = get(`https://dining-capacity.firebaseio.com/data/${hall}/${year}/${month}/${day}.json`);
    if(data == "null") {
        messageBox.innerHTML = "No data on the selected date!"; // TODO: add more info
        return points;
    } else messageBox.innerHTML = "";
    
    let hours = JSON.parse(data); // lots of hours
    for(let hour in hours) {
        let mins = hours[hour];
        for(let min in mins) {
            let date = new Date(`${year}-${month}-${day} ${hour}:${min}:00`);
            let percent = mins[min];
            
            points.push({x: date, y: percent, tooltip:`${getTime(date)}`});
        }
    }
    
    points.sort( (a, b) => a.x - b.x);
    
    return points;
}

function set(dataPoints, data) {
    dataPoints.splice(0, dataPoints.length);
    data.forEach(d => dataPoints.push(d));
}

function updateBarGraph() {
    let bars = getBarGraphData();
    set(barChart.options.data[0].dataPoints, bars[0]);
    set(barChart.options.data[1].dataPoints, bars[1]);
    barChart.render();
}

function updateLineGraph() {
    let arr;
    if(dateSupported) {
        let [year, month, day] = dateInput.value.split("-");
        arr = getLineGraphData(hallSelector.value, year, month, day);
    } else {
        arr = getLineGraphData(hallSelector.value, yearInput.value, monthSelector.value, daySelector.value);
    }

    set(lineChart.options.data[0].dataPoints, arr);
    lineChart.render();
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

window.onload = () => {
    if(!dateSupported) {
        // hide date picker input, show the selectors
        document.getElementById("fallback").style.display = "";
        document.getElementById("dateSupported").style.display = "none";
    }

    // add the halls to the hall selector
    for(let i = 0; i < halls.length; i++) {
        let option = document.createElement("option");
        option.text = halls_pretty[i];
        option.value = halls[i];
        hallSelector.add(option);
    }

    // add the days on the day selector, 1 to 31
    for(let i = 1; i < 32; i++) {
        let option = document.createElement("option");
        option.text = i.toString();
        option.value = pad(i);
        daySelector.add(option);
    }

    selectNow();

    barChart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: "Current Capacity"              
        },
        axisY: {
            title: "Capacity(%)"
        },
        axisX: {
            title: "Dining Halls"
        },
        toolTip: {
            content: "<span style='\"'color: {color}'\"'>{label}</span>: {y}%"
        },
        data: [  
            {
                type: "stackedColumn100",
                legendText: "Full",
			    showInLegend: "true",
			    indexLabel: "#percent %",
			    indexLabelPlacement: "inside",
			    indexLabelFontColor: "white",
                dataPoints: []
            },
            {
                type: "stackedColumn100",
                legendText: "Empty",
                showInLegend: "true",
                dataPoints: []
            }
        ]
    });
    barChart.render();
    
    lineChart = new CanvasJS.Chart("lineChartContainer", {
        title: {
            text: "Past Traffic"              
        },
        axisY: {
            title: "Capacity (%)",
            maximum: 100
        },
        axisX: {
            title: "Time"
        },
        toolTip: {
            content: "<span style='\"'color: {color}'\"'>{tooltip}</span>: {y}%"
        },
        data: [              
            {
                type: "line",
                dataPoints: []
            }
        ]
    });
    lineChart.render();
    
    updateBarGraph();
    updateLineGraph();
    
    // wait until 500ms after the last expected update (time % 5min == 0) to start updating regularly
    const SLEEP = 300000;
    setTimeout( () => {
        // initial update
        updateBarGraph();
        updateLineGraph();

        setInterval( () => {
            // update graphs
            updateBarGraph();
            updateLineGraph();
        }, SLEEP);
    }, SLEEP - (Date.now() % SLEEP) + 500);
};