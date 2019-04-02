var lineChart;
        
function Get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}

window.onload = function () {
    day = "Sunday";
    hall = "bolton";

    var halls = ["bolton", "ohouse", "snelling", "summit", "scott"];
    var halls_pretty = ["Bolton", "O-House", "Snelling", "Joe Frank", "The Niche"];
    
    var arr_b = [];
    var arr_r = [];
    for(var i = 0; i < halls.length; i++) {
        var url_last_update = JSON.parse(Get("https://dining-capacity.firebaseio.com/data/last_update.json")).url;
        var url = url_last_update.replace("{}", halls[i]);
        var percent = parseInt(Get(url));
        
        arr_b.push({label: halls_pretty[i], y: percent});
        arr_r.push({label: halls_pretty[i], y: 100 - percent});
    }

    var chart = new CanvasJS.Chart("chartContainer", {
        title:{
            text: "Current Capacity"              
        },
        axisY:{
            title: "Capacity(%)"
        },
        data: [              
            {
                // Change type to "doughnut", "line", "splineArea", etc.
                type: "stackedColumn100",
                dataPoints: arr_b
            },
            {
                // Change type to "doughnut", "line", "splineArea", etc.
                type: "stackedColumn100",
                dataPoints: arr_r
            }
        ]
    });
    chart.render();
    lineChart = new CanvasJS.Chart("lineChartContainer", {
        title:{
            text: "Past Traffic"              
        },
        axisY:{
            title: "Capacity(%)"
        },
        data: [              
            {
                // Change type to "doughnut", "line", "splineArea", etc.
                type: "line",
                dataPoints: get_arr(day)

            }
        ]
    });
    lineChart.render();
}

function getSelector(id) {
    var e = document.getElementById(id);
    return e.options[e.selectedIndex].value;
}

function get_arr(day) {
    const var hall = getSelector("selector_hall");
    const var year = document.getElementById(id).value;
    const var month = getSelector("selector_month");
    const var day = getSelector("selector_day");
    var url = `https://dining-capacity.firebaseio.com/data/$(hall)/$(year)/$(month)/$(day).json`;
    
    var points = [];
    if(url == "null") {
        document.getElementById("message").innerHTML = "No data on the selected date!"; // TODO: add more info
        return points;
    } else document.getElementById("message").innerHTML = "";
    
    var hours = JSON.parse(Get(url)); // lots of hours
    var hours_keys = Object.keys(json_b);
    for(var i = 0; i < keys.length; i++) {
        var mins = hours[hours_keys[i]];
        
        var mins_keys = Object.keys(mins);
        for(var j = 0; j < mins_keys.length; j++) {
        
            var date = new Date(year, month, day, hours_keys[i], mins_keys[j], 0, 0);
            var percent = mins[mins_keys[j]];
            
            points.push({x: date, y: percent});
        }
    }
    
    return points;
}

function update() {
    var arr = get_arr(day);
    lineChart.data[0].set("dataPoints", arr);
    lineChart.render();
}

function changed() {
    // check if stuff is correct
}