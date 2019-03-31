import requests, json
from os import listdir

path = "raw_logs"
logs = [f for f in listdir(path)]

# has days with times and occupancy inside
#data[hall][year][week #][day][time] = percent
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
        
        data[hall][unix_time] = percent
       

print(data)
        
headers = {'Content-type': 'application/json'}
requests.put('https://dining-capacity.firebaseio.com/data.json', headers=headers, data=json.dumps(data))