#! /usr/bin/python3
import time, requests, json

PAGE = 'https://www.cardservices.uga.edu/fs_mobile/index.php/dashboard/occupancies/'
DATABASE = 'https://dining-capacity.firebaseio.com/data/'

def update_data():
    # update the data at the REST endpoint
    current_time = int(time.time())
    
    page_no = DATABASE + time.strftime('{}/%Y/%m/%d/%H/%M.json')
    
    jsonE = requests.get(PAGE).json()
    headers = {'Content-type': 'application/json'}
    for hall, percent in jsonE.items():
        do_page = page_no.format(hall)
        
        requests.put(do_page, headers=headers, data=str(percent))
    
    last_update = {
        "time": current_time,
        "url": page_no
    }
    next_update = current_time + 300
    
    requests.put(DATABASE + 'last_update.json', headers=headers, data=json.dumps(last_update))
    requests.put(DATABASE + 'next_update.json', headers=headers, data=str(next_update))
    return next_update
        

SLEEP_TIME = 5 * 60

# get first t that is an even 5 minute interval
unix_time = int(time.time())
t = unix_time + 300 - (unix_time % SLEEP_TIME)

i = 0
while True:
    print('Time: {:12d} Iteration: {:6d}'.format(t, i))
    update_data()
    t += SLEEP_TIME
    i += 1
    while t > time.time():
        time.sleep(1)