import requests, time, json
from os import listdir

def to_week(unix_time):
    return time.strftime('%W-%Y', time.gmtime(int(float(unix_time))))

path = "raw_logs"
logs = [f for f in listdir(path)]

# has days with times and occupancy inside
data = {}

for log in logs:
    full_path = path + '/' + log
    for line in open(full_path, 'r'):
        day, real_time, unix_time, percent = line.split(', ')
        day = day + '-' + to_week(unix_time)
        percent = percent.strip()
        if not day in data:
            data[day] = {}
        data[day][real_time] = percent

print(data)
        
headers = {'Content-type': 'application/json'}
requests.put('https://dining-capacity.firebaseio.com/rest/dining-capacity.json', headers=headers, data=json.dumps(data))