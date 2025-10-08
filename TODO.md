#  TODO

## Main

favicon
title on some pages without meta?

presences?

## Chart
copy

## BMC
[primary]
- fix bug infinite request if note expand on empty text/id
- fix description reactivity notesoption

[other]
- duplicate canvas and files
- move canvas to other project/team (copy + delete?)
- game
- export png


[Data migration]
from firebase realtime database to appwrite
    2. write script to import data to appwrite

for each project
    check projects /users/:id
         check project /notes.length > 0
                    for all /users of project
                        if not created user:
                            create user
                            create default team
                    if only one user:
                         active project his default team
                    if multiple users
                        create team
                        active project id = team
                    import project to active project
                        notes = []
                        for each /notes/
                            create item
                            project_id
                            type = 'bmc-note'
                            data = note content
                                if image
                                    import media and set id
                            save id to notes
                        create item with 
                            project_id
                            type = 'bmc-canvas'
                            data = {
                                title: project/info/name
                                logoColor: project/info/logoColor
                                logoImage: project/info/logoImage (import media) and set id
                                notes =  notes
                            }