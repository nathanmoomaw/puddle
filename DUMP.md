# Puddle — Task Dump

Feature requests and tasks. Format: `[]` = todo, `[x]` = done.

# Wednesday April 8

[x] read queue from domscribe
[x] marble drag and drop isn't working properly on mobile.
[x] bring roadmap items over from ribbon
[x] poly part of mono/poly rocker lost 2 of its lights
[x] same with arp, it should also have 3 light defined previously with ribbon
[x] ok let's make sure the logo doesn't overlap the puddle
[x] help me optimize this project as distinct from ribbon and cleanup all the mds, etc
[x] the puddle size should fill as much of the vertical screen as possible while leaving just enough space for the bottom controls
[x] make sure caveman skill running on this project
[x] make sure to optimize and minimize the use of route
[x] setup this project on obfuco.us at http://puddle.obfusco.us/, include http://puddle-dev.obfusco.us/ autodeploying from my dev branch
[x] new git scheme for this project.  will be working towards versions by default with puddle so i'm starting with nmj/v1.  this pattern should be considered the dev branch (autodeployiing to puddle-dev).  final versions will be tagged as v1, v2... and should live in perpetuity at http://puddle.obfusco.us/v1, etc.  http://puddle.obfusco.us/ should be autodeploying from the main branch (serving the last stable version)
[x] roadmap: future puddle version to have one where the puddle extends across entire screen with controls floating over it
[x] try moving bottom controls on desktop to be fixed on the bottom thus allowing the puddle more vertical space to fill up
[x] close some of this gap between the bottom of the puddle and the top of the bottom controls.  puddle should fill as much of the empty space as possible. ![alt text](<Screenshot 2026-04-08 at 16.36.52.png>)
[x] there's still about 50px of blank space between the puddle and the bottom controls.  see last screenshot
[x] let's implement the new logo, "puddle" to replace "ribbon" using the same font styles and placing the moebius strip through the loops on the dd's versus the bb's.
[x] on mobile the speed knob and its labels should align to the right of the octaves/scale
[x] on mobile move the reverb knob and label to the right of delay on the same row
[x] on mobile place crunch under the filter, also to the right of vcf
[x] mobile: increase height of the puddle by 50%
[x] desktop: height of 950px or more the puddle looks good, but any shorter than that the puddle starts to get overlapped by the bottom controls.  if need to add some space (but less than the 50px you just tried to fix) to accommodate for this that's fine.  primarily there should be no overlapping the puddle. secondarily the space between the puddle and the bottom controls should be no more than 25px at an size
[x] make play/arp and mono/poly rockers evenly sized so each side of each one fill 50%.  presently there's about 50px of unused space to the right of the arp and poly sides
[x] puddle logo is "ok" but seems to spell "pubble".  move the vertical bars to the right side of each of the loops
[x] rework the way the marble size button looks.  make it 1/2 the width it is currently.  get rid of the number or fraction and instead make this a button with 3 different sized silver lights, aligned vertically and starting with one representing the first size (1) at the top and the one for the second size (1/2) in the middle and the final one (1/3) size on the bottom.  each time the user clicks this button cycle the presently lit light to the current size of the marble and thusly change the marble size.   
[x] the marble slot itself shouldn't change size when smaller marbles are selected.  it should be fixed and not move around just like all the other controls should be behaving.
[x] controls that shift around are anti-pattern for this synth project and probably others.  note this for this project and as a general strategy to employ globally when specified
[x] align marble size button to the right of its container and give it 10px padding both sides
[x] align marble slot to the right as well, butting up to the left of the marble size button
[x] note failure to achieve line item 22.  need to undo the change that happened there cuz it's worse now.  let's work on this again perhaps interactively
[x] desktop, instead of side control panels adding scroll when view is short, if there's enough screen space flex controls out to the sides
[x] desktop, using asdf... keys to play the puddle not showing notes triggered on the puddle itself
[x] logo: flip the moebius horizontally, make sure vertical bars still align
[x] logo roadmap soon: smooth those mufuhs
[[]] on desktop and even mobile alway maximize space of the puddle:
[x] move both side control panels out as far as possible, like they're absolutely positioned to their respective sides, but always retain shape of the puddle and don't allow for overlaps - i did this
[x] the bottom panel should also never overlap the puddle.  the sides are now flexing with it properly, not really overlapping.  the bottom panel controls need to do the same thing, just containing/restraining the puddle, maintaining something relative to its shape
[x] make return do shake again (at least until rec/loop func brought back)
[x] the bottom controls also shouldn't disappear at reasonable desktop heights. they should squeeze the puddle shorter
[x] the space under the blue outline should be filled in by the puddle without bottom controls overlap![alt text](<Screenshot 2026-04-08 at 22.17.56.png>)
[x] how can we maximize the size of the puddle vertically to the area shown in this screen cap ?![alt text](<Screenshot 2026-04-08 at 22.32.23.png>)