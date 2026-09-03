# Company logos

Four marks live here, supplied by Chanchreek and processed for the wall:
backgrounds removed, edges kept anti-aliased, cropped to the mark, and scaled
to 180px tall — plenty for the 38px slot on a 3x screen.

    oracle.png
    ibm.png
    springer.png
    upes.png

Badhit Bal Vikas Kendra has no mark, so that cell shows a typographic wordmark
instead. Nothing is missing and nothing needs adding — the wall checks for each
file on load and falls back to type when one isn't there.

The files keep their original colours, but the wall flattens every mark to the
page's own ink so the row reads as one set and follows the light/dark flip.
To show them in full colour instead, drop the `filter` off `.wall__logo`
in styles.css.

To swap a mark, replace the file and keep the name. To add one, add a
`.wall__cell` in index.html and drop `<name>.png` in here.
