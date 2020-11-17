#! /usr/bin/python3 -B

import airlineinfo
import airportinfo
import json
import sys
import urllib.error as ue

def getInfo(mod,items):
    ad = {}
    while items:
        try:
            ad[items[0]] = {'IATA':airportinfo.sendQuery(mod.queryList["ICAO"],items[0],mod.queryList["IATA"])}
            ad[items[0]]['en-US'] = airportinfo.sendQuery(mod.queryList["ICAO"],items[0],mod.queryList["Name"])
            ad[items[0]]['zh-CN'] = airportinfo.sendQuery(mod.queryList["ICAO"],items[0],mod.queryList["Name"],'zh')
            ad[items[0]]['ja-JP'] = airportinfo.sendQuery(mod.queryList["ICAO"],items[0],mod.queryList["Name"],'ja')
            print(ad[items[0]])
            items = items[1:]
        except ue.URLError:
            print("Connection Failed. Retrying...")
        except ue.HTTPError:
            print("Connection Failed. Retrying...")
    return ad

def parseFlightTSV(stdin):
    title = stdin.readline()
    result = []
    for item in stdin:
        td = item.strip().split('\t')
        result.append({
            'airline':td[0],
            'flightno':int(td[1]),
            'depart':td[2],
            'arrive':td[3],
            'departtime':{'h':int(td[4].split(':')[0]),'m':int(td[4].split(':')[1])},
            'arrivetime':{'h':int(td[5].split(':')[0]),'m':int(td[5].split(':')[1])},
            'dayofweek':[int(i) for i in td[6]]
            })
        if len(td) == 8:
            result[-1]['note'] = td[7]
    return result

def main(args):
    if not args or args[0] in ('--airlines','--airport','-l'):
        airlines = ['CQH', 'CCA', 'CPA', 'CSN', 'DKH', 'SJO', 'JAL', 'CXA', 'CES', 'ANA', 'CSZ', 'AAR', 'KAL']
        json.dump(getInfo(airlineinfo,airlines),open('airline.json','w'))
    if not args or args[0] in ('--airports','--airport','-p'):
        airports = ['ZSQD', 'ZYTL', 'ZSHC', 'ZYTX', 'ZSPD', 'ZSFZ', 'ZSWX', 'RJAA', 'ZSCG', 'RJBB', 'ZLXY', 'ZYHB', 'ZGSZ', 'ZBTJ', 'ZSNJ', 'ZGGG', 'VHHH', 'RKSI']
        json.dump(getInfo(airportinfo,airports),open('airport.json','w'))
    if not args or args[0] in ('--flights','--flight','-f'):
        flights = open("flightList.tsv",'r')
        json.dump(parseFlightTSV(flights),open("flight.json",'w'))
    if args[0] in ('-?','-h','--help'):
        print('Use -p to update airport.json, -l to update airline.json, or no parameter to update both.')

if __name__ == '__main__':
    main(sys.argv[1:])
