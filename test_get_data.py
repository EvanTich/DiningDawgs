import time, requests, json

PAGE = "https://www.cardservices.uga.edu/fs_mobile/index.php/dashboard/occupancies/"

def update_data():
    # update the data at the REST endpoint
    unix_time = int(time.time())
    
    jsonE = requests.get(PAGE).json()
    headers = {'Content-type': 'application/json'}
    for hall, percent in jsonE.items():
        do_page = 'https://dining-capacity.firebaseio.com/data/{}.json'.format(hall)
            
        arr = {unix_time: percent}
        
        requests.patch(do_page, headers=headers, data=json.dumps(arr))
    return 'it\'s good!'
        
update_data()