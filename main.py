from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_bcrypt import Bcrypt
from datetime import timedelta
import sqlite3


app = Flask(__name__)
bcrypt = Bcrypt(app)
app.config['SECRET_KEY'] = 'dkf3sldkjfDF23fLJ3b'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=10)

# connect to the SQL Database
con = sqlite3.connect("password.db")
cur = con.cursor()
# Creates the User table
sql_query = """
    CREATE TABLE IF NOT EXISTS User 
    (
        username TEXT PRIMARY KEY, 
        password TEXT
    )
"""
cur.execute(sql_query)

# Connection to score database
con2 = sqlite3.connect("score.db")
cur2 = con2.cursor()
sql_query2 = """
    CREATE TABLE IF NOT EXISTS Score 
    (
        username TEXT PRIMARY KEY, 
        score INT
    )
"""

cur2.execute(sql_query2)

@app.route('/')
def home():
    return render_template("home.html")


@app.route('/instruction')
def instruction():
    if("user" not in session):
        return render_template("instructions.html")
    else:
        return render_template("instructions2.html")


@app.route('/scoreboard')
def scoreboard():
    #Sorts the scores in decending order showing top score on the very first
    sql_query2 = "SELECT username, score FROM Score ORDER BY score DESC;"
    con2 = sqlite3.connect("score.db")
    cur2 = con2.cursor()
    result = cur2.execute(sql_query2).fetchall()
    headings = ("Username", "Score")
    print(result)
    return render_template("scoreboard.html", headings=headings, data=result)

#Check if user is logs in sucessfully then renders the page where only logged in users can see
@app.route('/success/<username>')
def success(username):
    if("user" not in session):
        flash("must Login before you can access the page")
        return redirect(url_for('login'))
    elif(session['user'] != username):
        flash("This is not your account")
        return redirect(url_for('login'))
    else:
        return render_template("successful.html", name=username)

@app.route('/home2') #homepage after successful login
def home2():
    return render_template("home2.html")

@app.route('/scoreboard2', methods=['GET']) #scoreboard after successful login
def scoreboard2():
    sql_query2 = "SELECT username, score FROM Score ORDER BY score DESC;"
    con2 = sqlite3.connect("score.db")
    cur2 = con2.cursor()
    result = cur2.execute(sql_query2).fetchall()
    headings = ("Username", "Score")
    print(result)
    return render_template("scoreboard2.html", headings=headings, data=result)

#after users login helps a differnt nav shows up and this allow users to continously check their score status
@app.route('/AddScore')
def AddScore():
    return render_template("successful.html")
    
#When user click logout it clears user in session and redircets them to login page again
@app.route('/logout')
def logout():
    session.pop("user", None)
    return redirect(url_for('login'))

#Stores the score in a database
@app.route('/storeScore/<score>', methods=['POST'])
def storeScore(score):
    #checks if user is in session, if they are not redirect them to log in page
    if("user" not in session):
        flash("Must register/ log in before storing high score")
        redirect(url_for('login'))
    else:
        #Insert score in relation to user logged in
        try:
            sql_query2 = "INSERT INTO Score VALUES ('"
            sql_query2 += session['user'] + "','" + score + "')"
            con2 = sqlite3 .connect("score.db")
            cur2 = con2.cursor()
            cur2.execute(sql_query2)
            con2.commit()
            flash("User score successfully added to Scoreboard")
            return render_template('scoreboard.html')
        except sqlite3.IntegrityError:
            con2.close()
            #checks if user name already exsist on scoreboard
            sql_query2 = "SELECT * FROM Score WHERE "
            sql_query2 += "username = '"+ session['user'] + "';" 
            con2 = sqlite3.connect("score.db")
            cur2 = con2.cursor()
            row = cur2.execute(sql_query2).fetchall()
            #if new score is larger than score stored then update score on db
            if row[0][1] < int(score):
                sql_query2 = f"UPDATE Score SET score = {int(score)} WHERE "
                sql_query2 += f"username = '{session['user']}' ;"
                cur2.execute(sql_query2)
                con2.commit()
                flash("High Score Updated to Scoreboard")
            else:
                flash("Not new score")
    return render_template('scoreboard.html')

@app.route('/api/register', methods=['POST', 'GET'])
def register():
    if (request.method == "POST"):
        username = request.form['username']
        password = request.form['password']
        password_hashed = bcrypt.generate_password_hash(password)
        password_hashed_str = password_hashed.decode('utf-8')
        try:
            # get the cursor (a pointer to the DB)
            sql_query = "INSERT INTO User VALUES ('"
            sql_query += username + "','" + password_hashed_str + "')"
            # execute the query and commit the results
            con = sqlite3.connect("password.db")
            cur = con.cursor()
            cur.execute(sql_query)
            con.commit()
            flash("User successfully added")
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            #let signing up user's know if the user name has already been taken
            flash("Username already exists")
            con.close()
            return render_template('register.html')
    else:
        return render_template('register.html')


@app.route('/api/login', methods=['POST', 'GET'])
def login():
    if (request.method == "POST"):
        username = request.form['username']
        password = request.form['password']
        # get the cursor (a pointer to the DB)
        sql_query = "SELECT username, password FROM USER WHERE "
        sql_query += "username = '" + username + "';"
        # execute the query and commit the results
        con = sqlite3.connect("password.db")
        cur = con.cursor()
        rows = cur.execute(sql_query).fetchall()
        if (len(rows) == 0):
            flash("No such user: " + username)
            return render_template("login.html")
        #checks if input passsword is correct password for username
        elif (not bcrypt.check_password_hash(rows[0][1], password)):
            flash("Sorry, wrong password")
            return render_template("login.html")
        else:
            session["user"] = username
            return redirect(url_for('success', username=username))

    else:
        return render_template("login.html")


app.run(host='0.0.0.0', port=81, debug=True)
