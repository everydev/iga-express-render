# Render engine for Express using partial Html files

I was searching a simple render engine for Express that support nested object and nested partial html.
<br/>
I was pissed off to not find what I wanted.
<br/>
I just created a new one, enough fast to write a new one.
<br/>
Container page, called sometime Layout, is a WebPage class. 
It contains partial pages, called Component.
<br/>
WebPage class inherits from Component.
<br/>
Each Component can contains several other Components.
<br/>
A Component reference a Component by its name like this:
<br>
'#Component.topMenu#'
<br>
local object binding is done by declaring the property of the localData object:
<br>
'#title#' or
<br>
'#user.name#'

##Sample:
### Create a page object
    new WebPage("home", "home.html",
    { "og:site_name": "Fratelo", "og:type": "website" },
    {
        title: "Fratelo is your toolbox for freelancing",
        updated: "2019-07-15", token: "afeab-231e"
    },
    [
        new Component("topMenu", "_topMenu.html"),
        new Component("login", "_login.html", { username: "Pascal Martin" }),
        new Component("bodyContent", "_homeBodyContent.html")
    ])