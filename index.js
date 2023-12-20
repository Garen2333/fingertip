var inboundChar;
var outboundChar;
var device;
var packet_count = 0;

// Define the CodeLess UUIDs 
//var BPP_SVC_UUID = "0000fe40-cc7a-482a-984a-7f2ed5b3e58f";
/* // nbr uuid
var BPP_SVC_UUID = "00000000-0001-11e1-9ab4-0002a5d5c51b"; */
// p2p uuid 
//var BPP_SVC_UUID = "FD8E15A8-66EA-5115-CCBA-0E0818C4EA4F";
var UART_SVC_UUID = "6e400001-b5a3-f393-e0a9-e50r24dcca9e";

// var RX_CHAR_UUID   = "0000fe42-8e22-4541-9d4c-21edae82ed19";
// var TX_CHAR_UUID = "0000fe41-8e22-4541-9d4c-21edae82ed19";
/* var RX_CHAR_UUID   = "00e00000-0001-11e1-ac36-0002a5d5c51b";
var TX_CHAR_UUID = "00e00000-0001-11e1-ac36-0002a5d5c51b"; */
// p2p service id
// write characteristic
var RX_CHAR_UUID   = "6e400002-b5a3-f393-e0a9-e50r24dcca9eE";
// notify characteristic
var TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50r24dcca9e"; 

var no_data_yet = true;




function TimeSeriesWithMemory() {
    this.ts = new TimeSeries();
    this.lastValue = 0;
}

TimeSeriesWithMemory.prototype.append = function(time, value) {
    if (value !== 0) {
        this.lastValue = value;
    }
    this.ts.append(time, this.lastValue);
};

var glucose_ts = new TimeSeriesWithMemory();
var lactate_ts = new TimeSeriesWithMemory();
var vitamin_ts = new TimeSeriesWithMemory();
var ldopa_ts = new TimeSeriesWithMemory();

var past_glucose_ts = new TimeSeriesWithMemory();
var past_lactate_ts = new TimeSeriesWithMemory();
var past_vitamin_ts = new TimeSeriesWithMemory();
var past_ldopa_ts = new TimeSeriesWithMemory();

var state = 0;
var receivedData = [];
var receivedDataIndex = 0;

var parsed_arr_ecg = [];
var parsed_arr_ppg = [];
var parsed_arr_index = 0;
var xValues = [];
var xyValues = [];

var val_data_compare_ppg = 0.0;
var val_data_compare_ecg = 0.0;
var val_data_compare_last_ppg = 0.0;
var val_data_compare_last_ecg = 0.0;
var val_data_same_start_ppg = 0.0;
var val_data_same_start_ecg = 0.0;
var val_data_same_end_ppg = 0.0;
var val_data_same_end_ecg = 0.0;
var val_line_same_start = 0;
var val_line_same_end = 0;
var g_num_line = 0;

var dataLog = "";

var downsample = 0;

var settingsArr = new Uint8Array(8);

var startArr = new Uint8Array(10);

var test_chart_len = 500;

var alg_mode = 1;


var chartWidth = document.getElementById('stage').clientWidth * 0.4;
var totalDisplayMillis = 60000; // 60 seconds in milliseconds
var millisPerPixel = totalDisplayMillis / chartWidth;


var glucose_chart = new SmoothieChart(
    {
        millisPerPixel: millisPerPixel,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: '#000000', precision: 0 },
        //labels: { fillStyle:'rgb(0, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'rgb(153, 150, 150)', fillStyle:'rgb(248, 215, 218)',
          lineWidth: 0.5, millisPerLine: 12000, verticalSections: 6, },
          maxValue:160,minValue:80
    }
);


var past_glucose_chart = new SmoothieChart(
    {
        millisPerPixel: 10,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: 'black', precision: 0 },
        //labels: { fillStyle:'rgb(60, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'rgb(125, 0, 0)', fillStyle:'#f8d7da',
          lineWidth: 1, millisPerLine: 5000, verticalSections: 6, },
          maxValue:160,minValue:80
    }
);

var lactate_chart = new SmoothieChart(
    {
        millisPerPixel: millisPerPixel,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: '#000000', precision: 0 },
        grid: {strokeStyle:'rgb(153, 150, 150)',millisPerLine: 12000, verticalSections: 6, fillStyle: 'rgb(204, 229, 255)' },
        maxValue:50,minValue:5

    }
);

var past_lactate_chart = new SmoothieChart(
    {
        millisPerPixel: 10,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'linear',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: 'black', precision: 0 },
        //labels: { fillStyle:'rgb(60, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'#15b2d1', fillStyle:'#cce5ff',
          lineWidth: 1, millisPerLine: 2000, verticalSections: 6, },
          maxValue:50,minValue:5

    }
);

var vitamin_chart = new SmoothieChart(
    {
        millisPerPixel: millisPerPixel,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: '#000000', precision: 0 },
        //labels: { fillStyle:'rgb(60, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'rgb(153, 150, 150)', fillStyle:'rgb(212, 237, 218)',
          lineWidth: 1, millisPerLine: 12000, verticalSections: 6, },
          maxValue:50,minValue:0
    }
);

var past_vitamin_chart = new SmoothieChart(
    {
        millisPerPixel: 10,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: 'black', precision: 0 },
        //labels: { fillStyle:'rgb(60, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'#0eb579', fillStyle:'#d4edda',
          lineWidth: 1, millisPerLine: 2000, verticalSections: 6, },
        maxValue:50,minValue:0
    }
);


var ldopa_chart = new SmoothieChart(
    {
        millisPerPixel: millisPerPixel,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: '#000000', precision: 0 },
        //labels: { fillStyle:'rgb(60, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'rgb(153, 150, 150)', fillStyle:'rgb(255, 243, 205)',
          lineWidth: 1, millisPerLine: 12000, verticalSections: 6, },
          //maxValue:1000,minValue:0
    }
);

var past_ldopa_chart = new SmoothieChart(
    {
        millisPerPixel: 10,
        timestampFormatter: SmoothieChart.timeFormatter,
        interpolation: 'bezier',
        tooltip: true,
        labels: { fontSize: 0, fillStyle: 'black', precision: 0 },
        //labels: { fillStyle:'rgb(60, 0, 0)' },
        //grid: { borderVisible: false, millisPerLine: 2000, verticalSections: 21, fillStyle: '#000000' }
        grid: { strokeStyle:'#a89413', fillStyle:'#fff3cd',
          lineWidth: 1, millisPerLine: 2000, verticalSections: 6, },
          //maxValue:1000,minValue:0
    }
);

/* var test_chart = new Chart("bpchart", {
    type: "line",
    data: {
        labels: xValues,
        datasets: [{
            fill: false,
            pointRadius: 1,
            borderColor: "rgba(0,0,255,0.5)",
            //data: parsed_arr_ecg
            data: xyValues
        }]
    },
    options: {
        legend: { display: false },
        scales: {
            xAxes: [{ticks: { display: false }}],
          },
        // title: {
        //     display: true,
        //     text: "y = x * 2 + 7",
        //     fontSize: 16
        // }
    }
}); */

var algXvalues = ["SBP", "DBP"];
var algYvalues = [0, 0];
var barColors = ["red", "blue"];
var alg_chart = new Chart("algchart", {
    type: "bar",
    data: {
      labels: algXvalues,
      datasets: [{
        backgroundColor: barColors,
        data: algYvalues
      }]
    },
    options: {
      legend: {display: false},
      title: {
        display: true,
        text: "BP Algorithm"
      },
      scales: {
        xAxes: [{
            barPercentage: 0.5
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true
            }
        }],
    }
    }
  });

// Display text in log field text area 
function log(text) {
    var textarea = document.getElementById('log');
    textarea.value += "\n" + text;
    textarea.scrollTop = textarea.scrollHeight;
}

function normalize(arr_in) {
    var arr_ret, val_max, val_min, val_range;
    val_min = Math.min(...arr_in);
    val_max = Math.max(...arr_in);
    val_range = val_max - val_min;

    var arr_ret = arr_in.map( function(value) { 
        return (value - val_min) / val_range;
    } );

    return arr_ret;
  }


var csvData; // Store the CSV data
var currentIndex = 0; // Index to keep track of the current row being processed
var glucoseStats = { sum: 0, max: -Infinity, min: Infinity, count: 0 };
var lactateStats = { sum: 0, max: -Infinity, min: Infinity, count: 0 };
var vitaminStats = { sum: 0, max: -Infinity, min: Infinity, count: 0 };
var glucoseData = [];
var lactateData = [];
var vitaminData = [];
// Function to read and process the CSV file
function readAndProcessCSV() {
    Papa.parse('onBodyData.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            console.log("CSV data:", results.data);
            csvData = results.data; // Store the parsed data
            updateGraphs();
            setInterval(updateGraphs, 2500); // Update the graph every 2 seconds
        }
    });
}

// Update the updateGraphs function to include data storage
function updateGraphs() {
    if (currentIndex < csvData.length) {
        var row = csvData[currentIndex];
        var time = new Date();

        updateStatsAndGraph(time, row.glucose, glucose_ts, glucoseStats, 'glucose', glucoseData);
        updateStatsAndGraph(time, row.lactate, lactate_ts, lactateStats, 'lactate', lactateData);
        updateStatsAndGraph(time, row.vitaminC, vitamin_ts, vitaminStats, 'vitaminc', vitaminData);


        updateStatsAndGraph(time, row.glucose, past_glucose_ts, glucoseStats, 'glucose', glucoseData);
        updateStatsAndGraph(time, row.lactate, past_lactate_ts, lactateStats, 'lactate', lactateData);
        updateStatsAndGraph(time, row.vitaminC, past_vitamin_ts, vitaminStats, 'vitaminc', vitaminData);

        currentIndex++;
    } else {
        console.log("Reached the end of the CSV data");
        clearInterval(this);
    }
}

// Function to update statistics and graph for a given type
function updateStatsAndGraph(time, value, ts, stats, elementIdPrefix, dataArray) {
    if (value !== undefined && !isNaN(value)) {
        ts.append(time, value);
        
        stats.sum += value;
        stats.max = Math.max(stats.max, value);
        stats.min = Math.min(stats.min, value);
        stats.count += 1;

        updateStatsDisplay(stats, elementIdPrefix);

        // Store the data along with the timestamp
        dataArray.push({ time: time.toISOString(), value: value });

        document.getElementById(elementIdPrefix + 'Cur').textContent = value.toFixed(2);
    }
}

// Function to update the statistics display
function updateStatsDisplay(stats, elementIdPrefix) {
    var mean = stats.count > 0 ? (stats.sum / stats.count) : 0;
    document.getElementById(elementIdPrefix + 'Max').textContent = stats.max.toFixed(2);
    document.getElementById(elementIdPrefix + 'Min').textContent = stats.min.toFixed(2);
    document.getElementById(elementIdPrefix + 'Mean').textContent = mean.toFixed(2);
    //document.getElementById(elementIdPrefix + 'Cur').textContent = mean.toFixed(2);
}



let activeParameter = 'glucose';
let activeContentType = null;

function setActiveParameter(parameter) {
    activeParameter = parameter;
    log(activeParameter);
    updateDisplay();
}

function setActiveContentType(type) {
    activeContentType = type;
    log(activeParameter);
    updateDisplay();
}

function updateDisplay() {
    // First, hide all tab contents
    
    

    if (activeParameter && activeContentType) {
        const allContents = document.querySelectorAll('.tabcontent');
        allContents.forEach(el => el.style.display = 'none');
        // Display the active parameter's content
        const activeTab = document.getElementById(activeParameter);
        activeTab.style.display = 'block';

        // Within that tab, hide all content types
        const allTypes = activeTab.querySelectorAll('.chart, .numerical');
        allTypes.forEach(el => el.style.display = 'none');

        // Display the active content type
        const activeType = activeTab.querySelector(`.${activeContentType}`);
        activeType.style.display = 'block';
    }
}
// Incoming GATT notification was received
/* async function incomingData(event) {

    if (no_data_yet) {

        if (alg_mode == 1){
            document.getElementById('algchart').style.display = "none";
            document.getElementById('chart-area').style = "display:inline;";
            glucose_chart.start();
            lactate_chart.start();
        }
        else{
            //document.getElementById('alg-chart-area').style = "display:inline;";
            document.getElementById('chart-area').style = "display:none;";
            document.getElementById('spinner').style = "display:none;";
            document.getElementById('algchart').style.display = "";
        }
       
        no_data_yet = false;

        for (let x = 0; x < test_chart_len; x++) {
            xValues.push(x);
          }
    }
    for (var i = 0; i < event.target.value.byteLength; i++) {
        val = event.target.value.getUint8(i);
        receivedData[i] = val;
        console.log(event.target.value.byteLength);
        log(val);
    
    }
    console.log("receivedData: ", receivedData);
    parseRaw(receivedData);
} */

let stats = {
    CH0: {sum: 0, max: Number.MIN_VALUE, min: Number.MAX_VALUE, count: 0},
    CH1: {sum: 0, max: Number.MIN_VALUE, min: Number.MAX_VALUE, count: 0},
    CH2: {sum: 0, max: Number.MIN_VALUE, min: Number.MAX_VALUE, count: 0},
    CH3: {sum: 0, max: Number.MIN_VALUE, min: Number.MAX_VALUE, count: 0},
};

function incomingData(event) {
    // Get the raw data
    let rawData = event.target.value;

    // Convert the data to a string
    let strData = new TextDecoder().decode(rawData);

    // Split the string into lines
    let lines = strData.split('\n');

    for(let line of lines){
        // Parse the channel and value from the line
        let parts = line.split(':');
        if(parts.length < 2) continue; // Skip lines that don't contain ':'

        let channel = parts[0].trim();
        let value = parseFloat(parts[1].trim());
        if(isNaN(value)) continue; // Skip lines where the value is not a number

        // Update stats for this channel
        let channelStats = stats[channel];
        channelStats.sum += value;
        channelStats.count += 1;
        channelStats.max = Math.max(channelStats.max, value);
        channelStats.min = Math.min(channelStats.min, value);

        // Process the value based on the channel
        switch(channel) {
            case 'CH0':
                // Add the value to the rawData array
                console.log("CH0: ", value);
                document.getElementById('glucoseCur').innerHTML = value;
                document.getElementById('glucoseMax').innerHTML = stats.CH0.max;
                document.getElementById('glucoseMean').innerHTML = (stats.CH0.sum / stats.CH0.count).toFixed(2);;
                document.getElementById('glucoseMin').innerHTML = stats.CH0.min;
                graphRaw(value, 0,0,0);
                break;

            case 'CH1':
                // Add the value to the ecgData array
                console.log("CH1: ", value);
                document.getElementById('lactateCur').innerHTML = value;
                document.getElementById('lactateMax').innerHTML = stats.CH1.max;
                document.getElementById('lactateMean').innerHTML = (stats.CH1.sum / stats.CH1.count).toFixed(2);;
                document.getElementById('lactateMin').innerHTML = stats.CH1.min;
                graphRaw(0,value,0,0);
                break;

            case 'CH2':
                // Add the value to the ecgData array
                console.log("CH2: ", value);
                document.getElementById('vitamincCur').innerHTML = value;
                document.getElementById('vitamincMax').innerHTML = stats.CH2.max;
                document.getElementById('vitamincMean').innerHTML = (stats.CH2.sum / stats.CH2.count).toFixed(2);;
                document.getElementById('vitamincMin').innerHTML = stats.CH2.min;
                graphRaw(0,0,value, 0);
                break;
            
            case 'CH3':
                // Add the value to the ecgData array
                console.log("CH3: ", value);
                document.getElementById('ldopaCur').innerHTML = value;
                document.getElementById('ldopaMax').innerHTML = stats.CH3.max;
                document.getElementById('ldopaMean').innerHTML = (stats.CH3.sum / stats.CH3.count).toFixed(2);;
                document.getElementById('ldopaMin').innerHTML = stats.CH3.min;
                graphRaw(0,0,0,value);
                break;
        }
    }
}

function parseProcessed(data) {
    var time = new Date();
    var time = formatDate(new Date(), "yyyy/MM/dd HH:mm:ss");

    sbp = 0;
    dbp = 0;
    rri = 0;

    sbpAvg = get_avg_SBP(data[2]);
    dbpAvg = get_avg_DBP(data[5]);

    sbp = sbpAvg.avg;
    dbp = dbpAvg.avg;

    //rri = data[12] | (data[11] << 8);

    //TODO Calculate checksum

    document.getElementById("log").value = "";
    // log('SBP: ' + sbp + ', DBP: ' + dbp + ', RRI: ' + rri);
    // dataLog = dataLog + sbp + ', ' + dbp + ', ' + rri + '\n';
    log('SBP: ' + sbp + ', DBP: ' + dbp);
    dataLog = dataLog + time + ',' + data[2] + ',' + data[5] + ',' + sbp + ',' + dbp + '\n';

    graphProcessed(sbp, dbp);
}


function graphRaw(glucose, lactate, vitamin, ldopa) {
    var time = new Date();
    
    glucose_ts.append(time,glucose);
    lactate_ts.append(time,lactate);
    vitamin_ts.append(time,vitamin);
    ldopa_ts.append(time,ldopa);
}

function graphProcessed(sbp, dbp) {

    algYvalues[0] = sbp;
    algYvalues[1] = dbp;
    alg_chart.update();
}

async function onDisconnected() {
    log("Bluetooth connection terminated!");
    no_data_yet = true;
}

async function bleDisconnect() {

    

    if (device != null) {
        if (device.gatt.connected) {
            log("Disconnecting");
            device.gatt.disconnect();
        }
        else {
            log('> Bluetooth Device is already disconnected');
        }
    }
}

// Scan, connect and explore CodeLess BLE device
async function ble_connect() {
    try {
        // Define a scan filter and prepare for interaction with Codeless Service
        log('Requesting Bluetooth Device...');
        /*TODO: change the name of device and UUID*/
        //BPP_SVC_UUID = prompt("Please enter the Service UUID", "00000000-0000-0000-0000-000000000000"); // User input for the service UUID
        let serviceUuid =   '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
        device = await navigator.bluetooth.requestDevice({
            //acceptAllDevices : true,
            //filters: [{ name: 'WB5M DK' }],
            filters: [{ namePrefix: 'Nordic' }],
            optionalServices: [serviceUuid]
        });
        //var RX_CHAR_UUID = prompt("Please enter the RX Characteristic UUID", "00000000-0000-0000-0000-000000000000"); // User input for the RX characteristic UUID
        //let TX_CHAR_UUID = prompt("Please enter the TX Characteristic UUID", "00000000-0000-0000-0000-000000000000"); // User input for the TX characteristic UUID

        device.addEventListener('gattserverdisconnected', onDisconnected);
        // Connect to device GATT and perform attribute discovery
        server = await device.gatt.connect();
        
        const service = await server.getPrimaryService(serviceUuid);
        let characteristicUuid_1 = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
        const txChar = await service.getCharacteristic(characteristicUuid_1);
        let characteristicUuid_2 = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
        const flowcontrolChar = await service.getCharacteristic(characteristicUuid_2);
        
        
        setTimeout(() => {
            console.log("Delayed for 10 seconds.");
          }, "10000");
        // Subscribe to notifications
        log("connected");
        await flowcontrolChar.startNotifications();
        flowcontrolChar.addEventListener('characteristicvaluechanged', incomingData);
        log('Ready to communicate!\n');
        createTimeline();
        //document.getElementById('chart-area').style = "display:inline;";
        
    }
    catch (error) {
        log('Failed: ' + error);
    }
}




async function sendInput() {
    try {
        // Get the input value from the text field
        let inputValue = document.getElementById('input').value;

        // Convert the input string into bytes
        let encoder = new TextEncoder('utf-8');
        let data = encoder.encode(inputValue);

        // Get the TX Characteristic from the connected BLE device
        let serviceUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
        let characteristicUuid = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // This is the Tx characteristic UUID
        const service = await server.getPrimaryService(serviceUuid);
        const txChar = await service.getCharacteristic(characteristicUuid);

        // Write the data to the Tx Characteristic
        await txChar.writeValue(data);
        console.log('Data sent: ', inputValue);
    }
    catch(error) {
        console.error('Failed to send input: ', error);
    }
}


function createTimeline() {
    document.getElementById('glucosechart').height = window.innerHeight * 0.2;
    document.getElementById('glucosechart').width = window.innerWidth * 0.8;

    document.getElementById('pastglucosechart').height = window.innerHeight * 0.10;
    document.getElementById('pastglucosechart').width = window.innerWidth * 0.4;

    document.getElementById('vitaminchart').height = window.innerHeight * 0.2;
    document.getElementById('vitaminchart').width = window.innerWidth * 0.8;

    document.getElementById('pastvitaminchart').height = window.innerHeight * 0.1;
    document.getElementById('pastvitaminchart').width = window.innerWidth * 0.4;

    document.getElementById('lactatechart').height = window.innerHeight * 0.2;
    document.getElementById('lactatechart').width = window.innerWidth * 0.8;


    document.getElementById('pastlactatechart').height = window.innerHeight * 0.1;
    document.getElementById('pastlactatechart').width = window.innerWidth * 0.4;


    document.getElementById('ldopachart').height = window.innerHeight * 0.2 ;
    document.getElementById('ldopachart').width = window.innerWidth * 0.8;

        
    document.getElementById('pastldopachart').height = window.innerHeight * 0.1;
    document.getElementById('pastldopachart').width = window.innerWidth * 0.4;
   
    //document.getElementById('bpchart').width = document.getElementById('stage').clientWidth * 0.95;

    glucose_chart.addTimeSeries(glucose_ts.ts, {
        strokeStyle:'rgb(242, 73, 88)', fillStyle:'rgba(242, 73, 88, 0.3)', lineWidth:3

    });


    past_glucose_chart.addTimeSeries(past_glucose_ts.ts, {
        strokeStyle:'rgb(242, 73, 88)', fillStyle:'rgba(242, 73, 88, 0.3)', lineWidth:3

    });

    lactate_chart.addTimeSeries(lactate_ts.ts, {
        strokeStyle:'rgb(15, 198, 211)', fillStyle:'rgba(68, 229, 240, 0.3)', lineWidth:3
    });

    past_lactate_chart.addTimeSeries(past_lactate_ts.ts, {
        strokeStyle:'rgb(15, 198, 211)', fillStyle:'rgba(68, 229, 240, 0.3)', lineWidth:3
    });

    vitamin_chart.addTimeSeries(vitamin_ts.ts, {
        strokeStyle:'rgb(35, 219, 9)', fillStyle:'rgba(114, 236, 97,0.3)', lineWidth:3
    });

    past_vitamin_chart.addTimeSeries(past_vitamin_ts.ts, {
        strokeStyle:'rgb(35, 219, 9)', fillStyle:'rgba(114, 236, 97,0.3)', lineWidth:3
    });

    ldopa_chart.addTimeSeries(ldopa_ts.ts, {
        strokeStyle: 'rgba(255, 0, 0, 1)',
        lineWidth: 1
    });

    past_ldopa_chart.addTimeSeries(past_ldopa_ts.ts, {
        strokeStyle: 'rgba(255, 0, 0, 1)',
        lineWidth: 1
    });

    glucose_chart.streamTo(document.getElementById("glucosechart"));
    past_glucose_chart.streamTo(document.getElementById("pastglucosechart"));


    lactate_chart.streamTo(document.getElementById("lactatechart"));
    past_lactate_chart.streamTo(document.getElementById("pastlactatechart"));


    vitamin_chart.streamTo(document.getElementById("vitaminchart"));
    past_vitamin_chart.streamTo(document.getElementById("pastvitaminchart"));



    ldopa_chart.streamTo(document.getElementById("ldopachart"));
    past_ldopa_chart.streamTo(document.getElementById("pastldopachart"));


}

function calcChecksum()
{
    var    i   = 0;
    var     bcc = 0;

    for (var i = 0; i < 7; i++ )
    {
        /* cast */
        bcc ^= settingsArr[i]
    }

    settingsArr[7] = bcc;
}

function createSettings() {
    settingsArr[0] = 0x55;
    settingsArr[4] = parseInt(document.getElementById("gender").value, 10);
    settingsArr[6] = parseInt(document.getElementById("mode").value, 10);
    settingsArr[5] = parseInt(document.getElementById("style").value, 10);
    settingsArr[1] = parseInt(document.getElementById("height").value, 10);
    settingsArr[2] = parseInt(document.getElementById("weight").value, 10);
    settingsArr[3] = parseInt(document.getElementById("age").value, 10);

    alg_mode = settingsArr[6];

    calcChecksum();
}

function createStart(){
    //"swvstart\r\n" 
    startArr[0] = 's'.charCodeAt(0);
    startArr[1] = 'w'.charCodeAt(0);
    startArr[2] = 'v'.charCodeAt(0);
    startArr[3] = 's'.charCodeAt(0);
    startArr[4] = 't'.charCodeAt(0);
    startArr[5] = 'a'.charCodeAt(0);
    startArr[6] = 'r'.charCodeAt(0);
    startArr[7] = 't'.charCodeAt(0);
    startArr[8] = '\r'.charCodeAt(0);
    startArr[9] = '\n'.charCodeAt(0);

}

function adjust_width() {
    //document.getElementById('glucosechart').width = document.getElementById('stage').clientWidth * 0.4;
    //document.getElementById('lactatechart').width = document.getElementById('stage').clientWidth * 0.4;
    //document.getElementById('vitaminchart').width = document.getElementById('stage').clientWidth * 0.4;
    //document.getElementById('ldopachart').width = document.getElementById('stage').clientWidth * 0.4;
}

function interpolate(val_ppg, val_ecg) {
    var coef_a_ecg, coef_a_ppg, coef_b_ecg,
        coef_b_ppg, val_data_interpolate_ecg, 
        val_data_interpolate_ppg;

    val_data_compare_ppg = val_ppg;
    val_data_compare_ecg = val_ecg;

    if (val_data_compare_ecg !== val_data_compare_last_ecg && g_num_line !== 0) {
        val_line_same_end = g_num_line;
        val_data_same_end_ppg = val_data_compare_ppg;
        val_data_same_end_ecg = val_data_compare_ecg;
        coef_a_ppg = (val_data_same_start_ppg - val_data_same_end_ppg) / (val_line_same_start - val_line_same_end);
        coef_a_ecg = (val_data_same_start_ecg - val_data_same_end_ecg) / (val_line_same_start - val_line_same_end);
        coef_b_ppg = -1 * coef_a_ppg * val_line_same_start + val_data_same_start_ppg;
        coef_b_ecg = -1 * coef_a_ecg * val_line_same_start + val_data_same_start_ecg;

        for (var x = val_line_same_start, _pj_a = val_line_same_end; x < _pj_a; x += 1) {
            val_data_interpolate_ppg = coef_a_ppg * x + coef_b_ppg;
            val_data_interpolate_ecg = coef_a_ecg * x + coef_b_ecg;

            graphRaw(val_data_interpolate_ppg, val_data_interpolate_ecg,0,0);
        }

        val_line_same_start = g_num_line;
        val_data_same_start_ppg = val_data_compare_ppg;
        val_data_same_start_ecg = val_data_compare_ecg;
    }
    g_num_line += 1;
    val_data_compare_last_ppg = val_data_compare_ppg;
    val_data_compare_last_ecg = val_data_compare_ecg;

}

function save(filename, data) {
    
    if (alg_mode == 1) {
        filename += '_raw_';
    }
    else {
        filename += '_processed_';
    }
    filename += formatDate(new Date(), "yyyyMMdd_HHmmss");
    filename += '.csv';
    if (document.getElementById('savebutton').value == 'Save') {
        document.getElementById('savebutton').value = 'Saving';
        document.getElementById("savebutton").classList.remove('button3');
        document.getElementById("savebutton").classList.add('button3_on');
        dataLog = "";

        if (alg_mode == 1) {
            dataLog = "ppg,ecg\n";
        }
        else {
            dataLog = "time,sbp,dbp,sbp-avg,dbp-avg\n";
        }
    }
    else {
        document.getElementById('savebutton').value = 'Save';
        document.getElementById("savebutton").classList.remove('button3_on');
        document.getElementById("savebutton").classList.add('button3');

        //     data = csvHeader + data;
        const blob = new Blob([data], { type: 'text/csv' });
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else {
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
    }
}

var DBP_AVGS = 4;
var DBP_buffer = new Float32Array(DBP_AVGS);
var DBP_int_buffer = new Int16Array(DBP_AVGS);
var DBP_buffer_ind = 0;
var num_DBPs = 0;
function get_avg_DBP(new_DBP)
{ //simple mean. Resets when passed a zero.
	
	var new_avg = 0;
	var int_avg = 0;
	var bits_of_prec = 12; //bits of precision
	var rms = 0;
	var new_ind;
    var DBP_rms = 0;

	if (new_DBP > 0)
	{ //>0 valid, do average
		num_DBPs++; //increment number to average
		if (num_DBPs > DBP_AVGS) num_DBPs = DBP_AVGS; //truncate number of averages at max value
		DBP_buffer[DBP_buffer_ind] = new_DBP; //load new sample into buffer
		DBP_int_buffer[DBP_buffer_ind] = new_DBP * (2 ** bits_of_prec);
		new_ind = DBP_buffer_ind; //get index of current latest sample

		DBP_buffer_ind++; //increment buffer pointer for next time
		if (DBP_buffer_ind == DBP_AVGS)
			DBP_buffer_ind = 0; //loop back

		for (var n = 0; n < num_DBPs; n++)
		{
			new_avg += DBP_buffer[new_ind]; //add each previous PI value
			int_avg += DBP_int_buffer[new_ind];
			new_ind--; //decrement pointer
			if (new_ind < 0)
				new_ind += DBP_AVGS; //loop back
		}
		new_avg /= num_DBPs;
		int_avg /= num_DBPs;
		new_ind = DBP_buffer_ind - 1;
		if (new_ind < 0)
			new_ind += DBP_AVGS; //loop back
		for (var n = 0; n < num_DBPs; n++)
		{
			rms += ((DBP_int_buffer[new_ind] - int_avg)
					* (DBP_int_buffer[new_ind] - int_avg));
			new_ind--;
			if (new_ind < 0)
				new_ind += DBP_AVGS;
		}
		rms /= num_DBPs; //divide by number of samples
		rms = Math.sqrt(rms); //square root
		DBP_rms = rms * (2 ** (-bits_of_prec)); //convert back to float
	}
	else
	{ //reset
		new_avg = new_DBP;
		num_DBPs = 0;
		DBP_buffer_ind = 0;
		DBP_rms = 0;
	}

	return {
        'avg': Math.round(new_avg),
        'rms': DBP_rms
    };
}

var SBP_AVGS = 4;
var SBP_buffer = new Float32Array(SBP_AVGS);
var SBP_int_buffer = new Int16Array(SBP_AVGS);
var SBP_buffer_ind = 0;
var num_SBPs = 0;
function get_avg_SBP(new_SBP) { //simple mean. Resets when passed a zero.

    var new_avg = 0;
    var int_avg = 0;
    var bits_of_prec = 12; //bits of precision
    var rms = 0;
    var new_ind;
    var SBP_rms = 0;

    if (new_SBP > 0) { //>0 valid, do average
        num_SBPs++; //increment number to average
        if (num_SBPs > SBP_AVGS) num_SBPs = SBP_AVGS; //truncate number of averages at max value
        SBP_buffer[SBP_buffer_ind] = new_SBP; //load new sample into buffer
        SBP_int_buffer[SBP_buffer_ind] = new_SBP * (2 ** bits_of_prec);
        new_ind = SBP_buffer_ind; //get index of current latest sample

        SBP_buffer_ind++; //increment buffer pointer for next time
        if (SBP_buffer_ind == SBP_AVGS)
            SBP_buffer_ind = 0; //loop back

        for (var n = 0; n < num_SBPs; n++) {
            new_avg += SBP_buffer[new_ind]; //add each previous PI value
            int_avg += SBP_int_buffer[new_ind];
            new_ind--; //decrement pointer
            if (new_ind < 0)
                new_ind += SBP_AVGS; //loop back
        }
        new_avg /= num_SBPs;
        int_avg /= num_SBPs;
        new_ind = SBP_buffer_ind - 1;
        if (new_ind < 0)
            new_ind += SBP_AVGS; //loop back
        for (var n = 0; n < num_SBPs; n++) {
            rms += ((SBP_int_buffer[new_ind] - int_avg)
                * (SBP_int_buffer[new_ind] - int_avg));
            new_ind--;
            if (new_ind < 0)
                new_ind += SBP_AVGS;
        }
        rms /= num_SBPs; //divide by number of samples
        rms = Math.sqrt(rms); //square root
        SBP_rms = rms * (2 ** (-bits_of_prec)); //convert back to float
    }
    else { //reset
        new_avg = new_SBP;
        num_SBPs = 0;
        SBP_buffer_ind = 0;
        SBP_rms = 0;
    }

    return {
        'avg': Math.round(new_avg),
        'rms': SBP_rms
    };
}

function formatDate(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};
