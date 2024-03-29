#!/usr/bin/python3
import time, requests, json
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

# Define the required scopes
scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/firebase.database"
]

# Authenticate a credential with the service account
# I am obviously not going to give out the key file on github
credentials = service_account.Credentials.from_service_account_file(
    "path/to/serviceAccountKey.json", scopes=scopes)

# Use the credentials object to authenticate a Requests session.
# Works the exact same way as requests!
authed_session = AuthorizedSession(credentials)

PAGE = 'https://apps.auxiliary.uga.edu/Dining/OccupancyCounter/api/occupancy.php'
DATABASE = 'https://dining-capacity.firebaseio.com/data/'
headers = {'Content-type': 'application/json'}

def put(loc, data):
    authed_session.put(DATABASE + loc, headers=headers, data=data)

def update_data():
    # update the data at the REST endpoint
    current_time = int(time.time())

    page_no = time.strftime('{}/%Y/%m/%d/%H/%M.json')

    data = requests.get(PAGE).json()
    if not data['enabled']:
        print('Dining counter not enabled:', data['disabledMessage'])
        return

    halls = data['diningHalls']
    for hall, more in halls.items():
        # example: ["Bolton", "bolton", 5]
        do_page = page_no.format(hall)

        put(do_page, str(more['availability']))

    last_update = {
        "time": current_time,
        "url": DATABASE + page_no
    }
    next_update = current_time + 300

    put('last_update.json', json.dumps(last_update))
    put('next_update.json', str(next_update))

SLEEP_TIME = 5 * 60

# get first t that is an even 5 minute interval
unix_time = int(time.time())
t = unix_time + SLEEP_TIME - (unix_time % SLEEP_TIME)

i = 0
while True:
    while t > int(time.time()):
        time.sleep(2)
    # print('Time: {:12d} Iteration: {:6d}'.format(t, i))
    try:
        update_data()
    except requests.exceptions.ConnectionError as e:
        # print("Connection error at ", int(time.time()), file=sys.stderr)
        continue
    except requests.exceptions.RequestException as e:
        print('HTTP/other error:', e, file=sys.stderr)
        break
    t += SLEEP_TIME
    i += 1
