#! /usr/bin/python3 -B

import cgi
import json
import os
import sqlite3
import time

_dbaddr = "../secret/flightpal.db"

def countEntry(stdin):
    db = sqlite3.connect(_dbaddr)
    c = db.cursor()
    c.execute("SELECT count(time) FROM main")
    print("Content-Type: text/plain\n")
    print(c.fetchone()[0])
    c.close()

def countUser(stdin):
    ui = []
    for item in ("airline","flightno","date"):
        ui.append(stdin.getvalue(item))
    if None in ui:
        print("Status: 400")
        print("Content-Type: text/plain")
        print("X-ErrorMsg: Required Value Not Supplied\n")
        print(0)
    else:
        db = sqlite3.connect(_dbaddr)
        c = db.cursor()
        c.execute("SELECT count(time) FROM main WHERE airline=? AND flightno=? and date=?",(ui[0],ui[1],ui[2]))
        print("Content-Type: text/plain\n")
        print(c.fetchone()[0])
        c.close()

def checkDup(stdin):
    ui = []
    for item in ("name","password","contact","url"):
        ui.append(stdin.getvalue(item))
    if ui[3] is None:
        ui[3] = ""
    if None in ui:
        print("Status: 400")
        print("Content-Type: text/plain")
        print("X-ErrorMsg: Required Parameter Not Supplied\n")
        print("error")
    else:
        print("Content-Type: text/plain\n")
        print(dbCheckDup(ui))

def dbCheckDup(ui):
    db = sqlite3.connect(_dbaddr)
    c = db.cursor()
    c.execute("SELECT count(time) FROM main WHERE name=? AND password!=?",(ui[0],ui[1]))
    tmp = c.fetchone()[0]
    c.close()
    if tmp != 0:
        return "name"
    c = db.cursor()
    c.execute("SELECT count(time) FROM main WHERE name!=? AND contact=? AND url=?",(ui[0],ui[2],ui[3]))
    tmp = c.fetchone()[0]
    c.close()
    if tmp != 0:
        return "contact"
    return "clear"

def printPal(login,db):
    result = {}
    c = db.cursor()
    c.execute("SELECT airline,flightno,date,time FROM main WHERE name=? AND password=?",login)
    tmp = c.fetchone()
    c.close()
    result = {'airline':tmp[0],'flightno':int(tmp[1]),'date':tmp[2]}
    c = db.cursor()
    c.execute("SELECT count(time) FROM main WHERE airline=? AND flightno=? AND date=? AND time<?",tmp)
    result['seq'] = 1+c.fetchone()[0]
    c.close()
    c = db.cursor()
    c.execute("SELECT name,contact,url,time FROM main WHERE airline=? AND flightno=? AND date=?",tmp[:3])
    result['pal'] = c.fetchall()
    c.close()
    result['update'] = int(time.time())
    return result

def getPal(stdin):
    ui = []
    for item in ("name","password"):
        ui.append(stdin.getvalue(item))
    if None in ui:
        print("Status: 400")
        print("Content-Type: text/plain")
        print("X-ErrorMsg: Required Credential Not Supplied\n")
        print("Please supply your login credentials.")
    else:
        db = sqlite3.connect(_dbaddr)
        c = db.cursor()
        c.execute("SELECT airline,flightno,date FROM main WHERE name=? AND password=?",ui)
        tmp = c.fetchone()
        c.close()
        if tmp is None:
            print("Status: 406")
            print("Content-Type: text/plain")
            print("X-ErrorMsg: Login Failed\n")
            print("Login failed.")
        else:
            print("Content-Type: application/json\n")
            print(json.dumps(printPal(ui,db)))

def main():
    stdin = cgi.FieldStorage()
    act = stdin.getvalue("action")
    if act == 'count':
        countUser(stdin)
    elif act == 'entry':
        countEntry(stdin)
    elif act == 'check':
        checkDup(stdin)
    elif act == 'get':
        getPal(stdin)
    else:
        addEntry(stdin)

def addEntry(stdin):
    ui = []
    for item in ("airline","flightno","date","name","password","contact","url"):
        ui.append(stdin.getvalue(item))
    if ui[-1] is None:
        ui[-1] = ""
    if None in ui:
        print("Status: 400")
        print("Content-Type: text/plain")
        print("X-ErrorMsg: Required Data Not Supplied\n")
        print("Fatal Error: One of the required information was left blank when you submit this form. Please try again.")
        return
    if dbCheckDup(ui[3:7]) != "clear":
        print("Status: 400")
        print("Content-Type: texxt/plain")
        print("X-ErrorMsg: Data Integrity Check Failed\n")
        print("Fatal Error: Your data failed some checks on our side. Please try again.")
        print("Failed check: "+dbCheckDup(ui[3:7]))
        return
    ui.append(os.environ.get('REMOTE_ADDR'))
    ui.append(os.environ.get('HTTP_USER_AGENT'))
    ui.append(int(time.time()))
    db = sqlite3.connect(_dbaddr)
    c = db.cursor()
    c.execute("SELECT count(time) from main WHERE name=? AND password=?",ui[3:5])
    tmp = c.fetchone()[0]
    c.close()
    c = db.cursor()
    if tmp !=  0:
        c.execute("DELETE from main WHERE name=? AND password=?",ui[3:5])
    c.execute("INSERT into main VALUES (?,?,?,?,?,?,?,?,?,?)",ui)
    db.commit()
    c.close()
    db.close()
    print("Status: 302")
    print("Location: https://s.aureus.life/FlightPal/view/")
    print("Content-Type: text/plain\n")
    print("Your data has been recorded into our database.")
    print(ui)

if __name__ == '__main__':
    main()
