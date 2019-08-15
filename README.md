# UGADiningCapacity
By the by: Never ever run the setup script unless you want to delete everything in the database.

Github Pages link : https://jlc94087.github.io/UGADiningCapacity/


## How to make the website work
Use a Raspberry Pi to host the python file [here](get_data_bot.py) and run it using Python 3.


## Database structure and access
Note: unix_time is in seconds since the epoch and hall = bolton, summit, ohouse, snelling, or smith
*other stuff can go in data too (like stats) if needed*
```
data: {
    last_update: {
        time: unix_time,
        url: string with the hall replaced with {}
    },
    next_update: unix_time,
    
    
    hall: { 
        year: {
            month: {
                day: {
                    hour: {
                        min: percent
                    }
                }
            }
        }
    }
}
```
Call `https://dining-capacity.firebaseio.com/data/{hall}/{year}/{month}/{day}/{hour}.json` to get every timestamp and percent.
For example: `https://dining-capacity.firebaseio.com/data/bolton/2019/2/22.json` to get every timestamp and percent from that day.

Look at [this](https://firebase.google.com/docs/database/rest/retrieve-data) for more ways of getting the data.


## TODO
- [x] Change the database to be good
    - [x] /data/hall/year/month/day/hour/min.json = percent
    - [x] Change the scripts to add correctly too.
    - [x] Actually put on database 
- [x] Make the database "private" so you have to use an auth code
- [ ] Make the website server side to make sure people can't get to the underlying database (and auth keys)
- [x] Instead of listing the day when hovering over the line plot, list the hours and minutes
- [x] Update the website's current capacity periodically (every 5 minutes)
- [ ] Fix the positioning of the selectors
- [ ] Stop a user from choosing an invalid date
    - [x] user can only choose actual dates, e.g. Feb 30 (doesn't exist)
- [ ] Option to show all dining hall lines on same graph
- [ ] Have a proper title, heading, and stuff below on the page
- [ ] Perhaps change from CanvasJS to a free alternative (that link in the bottom is stupid)
- [x] Asyncronous calls for getting the ~json data~(sorta) and updating the graph
- [ ] Seperate the two tabs from one page to two pages
- [ ] Fix width of the graph being messed up when the page loads initially
