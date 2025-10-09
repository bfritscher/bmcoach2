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
app.projects.<project_id>
    .info
        name
        logoColor
        logoImage (media)
    .users.<id>
    .notes.<id>
        image (media)


stats?
how many projects grouped by notes count
how many projects grouped by users count
how many games copy?
how many images on notes
how many images on canvas


for each project
    check projects /users/:id
         check project /notes.length > 0
                    for all /users of project
                        if not created user:
                            create user
                            create default team
                    if only one user:
                         active project destination his default team
                    if multiple users
                        create team = project name
                        add all users to team
                        active project destination = new team id
                    import project to active project
                        notes = []
                        for each /notes/
                            create item
                            project_id = active project (teamid)
                            type = 'bmc-note'
                            data = note content
                                if image
                                    import media to storage and set id
                            save id to notes
                        create item with 
                            project_id = active project (teamid)
                            type = 'bmc-canvas'
                            data = {
                                title: project/info/name
                                logoColor: project/info/logoColor
                                logoImage: project/info/logoImage (import media) and set id
                                notes =  notes
                            }