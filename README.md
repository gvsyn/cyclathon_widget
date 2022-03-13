# cyclathon_widget
SE widget for doing distance based "subathon"

Included a PNG to use as a mask for an extra map overlay (for the time
being, it'd be a lot nicer if the widget map worked).

There are a couple of controls still in there that need plumbing in
and it could probably do with a font picker. It was a quick put
together and test anyway.

Now with mod/broadcaster commands.
`!cycle <action>`

`add <counter> <amount>` - See the counter list below, 
`del <counter> <amount>` - it's like add, but negative
`set <counter> <amount>` - just set the value
`reset`                  - reset it all
`start`                  - show the widget, enable things to increase the distance
`stop`                   - hide, and stop things counting

List of counters:
    subs
    bits
    dono
    // distances
    total
    remaining // self updates, adjust the total
    covered
}

Final note: Tier2 and Tier3 subs count for x2 and x3 the sub value, respectively

## Getting it working

Create a new custom widget, and copy the html file to that tab, css
to css, js to js, json to fields and empty the data one.
