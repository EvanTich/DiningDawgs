const halls = ["bolton", "ohouse", "snelling", "summit", "scott"];
const halls_pretty = ["Bolton", "O-House", "Snelling", "Joe Frank", "The Niche"];

var barChart;
var lineChart;

var last_update_bar;
var last_update_line;

window.onload = function () {
    // add the days on the day selector
    var x = document.getElementById("selector_day");
    for(var i = 1; i < 33; i++) {
        var option = document.createElement("option");
        option.text = i.toString();
        option.value = (i < 10 ? "0" : "") + i;
        if(i == 1) {
            option.selected = "selected";
        }
        x.add(option);
    }

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
            title: "Capacity (%)"
        },
        axisX:{
            title: "Time (Hours)"
        },
        data: [              
            {
                type: "line",
                dataPoints: []
            }
        ]
    });
    lineChart.render();
    
    update_bars();
    update_line();
    
    periodic();
}

function periodic() {
    var now = Date.now() / 1000;
    
    if(last_update_bar + 150 <= now)
        update_bars();
    if(last_update_line + 150 <= now)
        update_line();
    
    setInterval(periodic, 150);
}

function get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}

function getSelector(id) {
    var e = document.getElementById(id);
    return e.options[e.selectedIndex].value;
}

function get_bars() {
    var arr_b = [];
    var arr_r = [];
    for(var i = 0; i < halls.length; i++) {
        var url_last_update = JSON.parse(get("https://dining-capacity.firebaseio.com/data/last_update.json")).url;
        var url = url_last_update.replace("{}", halls[i]);
        var percent = parseInt(get(url));
        
        arr_b.push({label: halls_pretty[i], y: percent});
        arr_r.push({label: halls_pretty[i], y: 100 - percent});
    }
    
    return [arr_b, arr_r];
}

function get_arr() {
    const hall = getSelector("selector_hall");
    const year = document.getElementById("input_year").value;
    const month = getSelector("selector_month");
    const day = getSelector("selector_day");
    var url = `https://dining-capacity.firebaseio.com/data/$(hall)/$(year)/$(month)/$(day).json`;
    
    url = url.replace("$(hall)", hall).replace("$(year)", year).replace("$(month)", month).replace("$(day)", day);
    
    var points = [];
    var data = get(url);
    if(data == "null") {
        document.getElementById("message").innerHTML = "No data on the selected date!"; // TODO: add more info
        return points;
    } else document.getElementById("message").innerHTML = "";
    
    var hours = JSON.parse(data); // lots of hours
    var hours_keys = Object.keys(hours);
    for(var i = 0; i < hours_keys.length; i++) {
        
        var mins = hours[hours_keys[i]];
        var mins_keys = Object.keys(mins);
        for(var j = 0; j < mins_keys.length; j++) {
  
            var str = year + "-" + month + "-" + day + " " + hours_keys[i] + ":" + mins_keys[j] + ":00";
            var date = new Date(str);
            var percent = mins[mins_keys[j]];
            
            points.push({x: date, y: percent});
        }
    }
    
    points.sort(function(a, b) {
        return a.x - b.x;
    });
    
    
    return points;
}

function update_bars() {
    var bars = get_bars();
    barChart.data[0].set("dataPoints", bars[0]);
    barChart.data[1].set("dataPoints", bars[1]);
    barChart.render();
    
    last_update_bar = Date.now() / 1000;
}

function update_line() {
    var arr = get_arr();
    lineChart.data[0].set("dataPoints", arr);
    lineChart.render();
    
    last_update_line = Date.now() / 1000;
}

function changed() {
    // check if stuff is correct
    update_line();
}
