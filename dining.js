const halls = ["bolton", "ohouse", "snelling", "summit", "scott"];
const halls_pretty = ["Bolton", "O-House", "Snelling", "Joe Frank", "The Niche"];

// selectors
const yearInput = document.getElementById("input_year");
const monthSelector = document.getElementById("selector_month");
const daySelector = document.getElementById("selector_day");
const hallSelector = document.getElementById("selector_hall");

const messageBox = document.getElementById("message");
const lastUpdatedBox = document.getElementById("lastUpdated");

var barChart;
var lineChart;

// TODO: more formatting

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
    let now = new Date();
    let year = now.getFullYear(),
        month = now.getMonth() + 1, // 0 is jan, but our jan is 1
        day = now.getDate();
    
    yearInput.value = year;
    monthSelector.value = pad(month);
    daySelector.value = pad(day);
}

function get(url) {
    let Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET", url, false);
    Httpreq.send(null);
    
    return Httpreq.responseText;
}

function getBarGraphData() {
    let actual = [];
    let invert = [];
    
    let lastUpdate = JSON.parse(get("https://dining-capacity.firebaseio.com/data/last_update.json"));
    let date = new Date(lastUpdate.time * 1000);
    // change last update box
    lastUpdatedBox.innerHTML = `Latest Update: ${getTime(date)}`;

    for(var i = 0; i < halls.length; i++) {
        let url = lastUpdate.url.replace("{}", halls[i]);
        let percent = parseInt(get(url));
        
        actual.push({label: halls_pretty[i], y: percent});
        invert.push({label: halls_pretty[i], y: 100 - percent});
    }
    
    return [actual, invert];
}

function getLineGraphData() {
    const hall = hallSelector.value; // only used once but kept here because why not
    const year = yearInput.value;
    const month = monthSelector.value;
    const day = daySelector.value;
    
    let points = [];
    let data = get(`https://dining-capacity.firebaseio.com/data/${hall}/${year}/${month}/${day}.json`);
    if(data == "null") {
        messageBox.innerHTML = "No data on the selected date!"; // TODO: add more info
        return points;
    } else messageBox.innerHTML = "";
    
    let hours = JSON.parse(data); // lots of hours
    let hours_keys = Object.keys(hours);
    for(let i = 0; i < hours_keys.length; i++) {
        
        let mins = hours[hours_keys[i]];
        let mins_keys = Object.keys(mins);
        for(let j = 0; j < mins_keys.length; j++) {
  
            let str = `${year}-${month}-${day} ${hours_keys[i]}:${mins_keys[j]}:00`;
            let date = new Date(str);
            let percent = mins[mins_keys[j]];
            
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
    let arr = getLineGraphData();
    set(lineChart.options.data[0].dataPoints, arr);
    lineChart.render();
}

function changed() {
    updateLineGraph();
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

window.onload = function() {
    // TODO: contruct the hall selector from the halls and halls_pretty arrays
    // reason: double data is bad

    // add the days on the day selector, 1 to 31
    for(var i = 1; i < 32; i++) {
        var option = document.createElement("option");
        option.text = i.toString();
        option.value = pad(i);
        daySelector.add(option);
    }

    selectNow();

    barChart = new CanvasJS.Chart("chartContainer", {
        title:{
            text: "Current Capacity"              
        },
        axisY:{
            title: "Capacity(%)"
        },
        axisX:{
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
        title:{
            text: "Past Traffic"              
        },
        axisY:{
            title: "Capacity (%)",
            maximum: 100
        },
        axisX:{
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
    
    // wait until 500ms after the last expected update to start updating regularly
    const SLEEP = 300000;
    setTimeout( () => {
        setInterval( () => {
            // update graphs
            updateBarGraph();
            updateLineGraph();
        }, SLEEP);
    }, SLEEP - (Date.now() % SLEEP) + 500);
};