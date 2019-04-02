var lineChart;
        
function Get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}

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
                dataPoints: get_arr()

            }
        ]
    });
    lineChart.render();
}

function getSelector(id) {
    var e = document.getElementById(id);
    return e.options[e.selectedIndex].value;
}

function pad(n) {
    return (n < 10 ? "0" : "") + n;
}

function get_arr() {
    const hall = getSelector("selector_hall");
    const year = document.getElementById("input_year").value;
    const month = getSelector("selector_month");
    const day = getSelector("selector_day");
    var url = `https://dining-capacity.firebaseio.com/data/$(hall)/$(year)/$(month)/$(day).json`;
    
    url = url.replace("$(hall)", hall).replace("$(year)", year).replace("$(month)", month).replace("$(day)", day);
    
    var points = [];
    var data = Get(url);
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

function update() {
    var arr = get_arr();
    lineChart.data[0].set("dataPoints", arr);
    lineChart.render();
}

function changed() {
    // check if stuff is correct
    update();
}