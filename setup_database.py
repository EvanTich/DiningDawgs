import requests, json, time
from os import listdir

path = "raw_logs"
logs = [f for f in listdir(path)]

# has days with times and occupancy inside
#data[hall][year][month][day][hour][min] = percent
data = {}

for log in logs:
    hall = log.split('.')[0]
    if not hall in data:
        data[hall] = {}
    
    full_path = path + '/' + log
    for line in open(full_path, 'r'):
        day, real_time, unix_time, percent = line.split(', ')
        
        unix_time = int(float(unix_time))
        percent = int(percent.strip())
        
        stuff = time.strftime('%Y/%m/%d/%H/%M', time.localtime(unix_time)).split('/')
        year = stuff[0]
        month = stuff[1]
        day = stuff[2]
        hour = stuff[3]
        min = stuff[4]
        
        if not year in data[hall]:
            data[hall][year] = {}
            
        if not month in data[hall][year]:
            data[hall][year][month] = {}
            
        if not day in data[hall][year][month]:
            data[hall][year][month][day] = {}
            
        if not hour in data[hall][year][month][day]:
            data[hall][year][month][day][hour] = {}
        
        data[hall][year][month][day][hour][min] = percent
    
    unix_time = time.time()
    # putting this because it was technically updated at this point
    data["last_update"] = {"time": unix_time, "url":"N/A"}
    # update in 5 minutes (300 seconds)
    data["next_update"] = unix_time + 300 

headers = {'Content-type': 'application/json'}
r = requests.put('https://dining-capacity.firebaseio.com/data.json', headers=headers, data=json.dumps(data))

if r.status_code == 200:
    print("data now inside database")
else:
    print("data failed to be added to database")
    print("status code: " + str(r.status_code))