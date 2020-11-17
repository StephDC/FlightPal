#! /usr/bin/python3 -B

import cgi
import json
import sys
import urllib.request as ur
import urllib.parse as up
import urllib.error as ue

queryList = {'Name':'P931','IATA':'P238','ICAO':'P239','Info':None}

def sendQuery(codeType,airportCode,queryType,langCode="en",debug=False):
    query = "SELECT ?item ?itemLabel ?itemInfo ?itemInfoLabel ?itemClose WHERE {?item wdt:"+codeType+" \""+airportCode+"\".OPTIONAL { ?item wdt:"+(queryType if queryType is not None else "P1705")+" ?itemInfo.} OPTIONAL{ ?item wdt:P582 ?itemClose.}. SERVICE wikibase:label { bd:serviceParam wikibase:language \""+langCode+"\"}}"
    if debug:
        print(query)
    req = ur.Request('https://query.wikidata.org/sparql',up.urlencode({'query':query}).encode('UTF-8'))
    req.add_header('Accept','application/sparql-results+json')
    result = "Data not found"
    try:
        data = json.loads(ur.urlopen(req).read().decode())
        if debug:
            print(data)
        for item in data['results']['bindings']:
            if 'itemClose' not in item and ((queryType is None and 'itemLabel' in item) or 'itemInfoLabel' in item):
                result = item['itemInfoLabel']['value'] if queryType is not None else item['itemLabel']['value']
                break
    except ue.HTTPError:
        result = "WikiData Query Error"
    except UnicodeDecodeError:
        result = "Result cannot be decoded"
    return result

def processInput():
    stdin = cgi.FieldStorage()
    airportCode = stdin.getvalue('airport')
    queryMethod = stdin.getvalue('info')
    if airportCode is None and queryMethod is None and len(sys.argv) == 3:
        airportCode = sys.argv[1]
        queryMethod = sys.argv[2]
    if airportCode is None or queryMethod is None:
        return "Required input was not present."
    if len(airportCode) == 3 and airportCode.isalnum():
        codeType = queryList['IATA']
    elif len(airportCode) == 4 and airportCode.isalnum():
        codeType = queryList['ICAO']
    else:
        return "Illegal Airport Code"
    if queryMethod not in queryList:
        return "Unsupported Info Requested"
    if codeType == queryMethod:
        return airportCode
    return sendQuery(codeType,airportCode,queryList[queryMethod])

def main():
    print("Content-Type: text/plain; charset=UTF-8\n")

    print(processInput())

if __name__ == '__main__':
    main()
