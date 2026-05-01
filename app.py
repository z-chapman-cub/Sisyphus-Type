from werkzeug.utils import send_from_directory
from flask import Flask, url_for, make_response, render_template

app = Flask(__name__)

#PAGES
#Game on index page
@app.route('/')
def index():
    return make_response(render_template("sisyphusType.html"))

# about rendered from an html
@app.route('/about')  
def about():
    return make_response(render_template("about.html"))

#HELPER ROUTES
#Load the Myth of Sisyphus to be fetched by the game
@app.route('/text')
def text():
    with open('data/text.txt','r',encoding="utf-8") as f:
        return f.read().splitlines()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3308)

