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
- oh my, finally, yes! looks good
[x] mobile: line scale and octaves in a row with speed until until they don't fit
[x] make the backgrounds of the osc panels 75% less opaque
[x] reduce the borders of the controls by 50%

# Thursday April 9

[x] smooth out left border of osc 3 at bottom, make it continue down in its section like a smoothly transparenting line
[x] shake controls need to also change the vcf settings, at a bit more frequency in fact, but still somewhat smooth adjustments
[x] add shake icon to left controls too.  - why not?

[x] let's attempt this from roadmap: Smooth möbius paths in logo (bezier refinement, tighter curves)
[x] continue with POAP integration and and NFT minting
[x] follow up to li 59: ![alt text](<Screenshot 2026-04-09 at 12.38.25.png>) I still want to see more smoothing along the vertical center of this part of the moebius
[x] still following up li 59: not really seeing much changes from what you've done so far.  want these  to be less nubby ![alt text](<Screenshot 2026-04-09 at 12.47.53.png>)
[x] logo refinement still not done.  need to put attention to it
[x] Matt says .controls__osc too wide, could slim down some - add to roadmap
[x] Safari performance needs work.  it's crawling right now
[x] placement of the milestone badge could be side by side with wallet and nicely aligned with the other buttons there
[x] move all these buttons to the upper right of screen at all sizes in this order from top to bottom: midi, poap, wallet
[x] move lower right qr to the upper left like the mobile qr is currently so they both have this in the same place
[x] roadmap: logo still needs work.  need to approach in a new way
[x] ios safari not making sound sometimes (gets confused with system volume?).  seems to get fixed if people turn off silent mode on their phones, but that shouldn't be necessary, should it?
[x] the splash screen still says ribbon, it should say puddle

--- V1 reached, tagged, deployed ---

[x] ok, note that we've reached v1 at this point.  let's update all the docs, make a v1 changelog and review DUMP for memory improvement and anything that should be memorized globally, update CLAUDE and README, too

# Friday April 10

[x] according to all my ios friends who test this the bug where if an iphone is on silent mode they don't hear sound still exists
[] todo: work on figuring out what the hell POAP do and test some mints
[x] todo: adjust mobile vcf position
[x] poap button only showing sometimes?
[x] poap modal thing presently goes off screen
[x] note: liking the static placement of the qr icon on the top  left and the midi, poap, wallet at the top right corner.  this should be default for synth apps born of this lineage in the future
[x] new feature for this project and likely it's successors: simple subtle info button just below the qr icon. try using a nice i icon of some sort that matches the app vibe.  it should invoke a modal with a one sentence synopsis, likely derived from mythos and it should have the app version number in there, too
[x] help me determine a good way to number these versions.  basically we're working towards v1, v2, etc, but each commit should sorta be thought of as a minor version number.  want way to automatically increment and keep track of which version has been deployed
  - Strategy: use `npm version patch` (bumps 1.0.x) for each commit batch, `npm version minor` for notable features (1.x.0), `npm version major` for tagged versions (v2.0.0 = v2). package.json version is read at build time by InfoModal. CI can tag the deploy with the version. Currently at 1.0.0 = v1.
[x] add a x to close out the info modal
[x] automate the version control, tying it to commits in github
  - CI now injects VITE_GIT_SHA into all build jobs; InfoModal shows `v1.0.0 · abc1234` (version + short commit SHA)
[x] let's rethink the strategy for what lives at /v1.  it's presently coming from the tag i believe, but I think it makes more sense to create a v1 branch (distinct from my personal nmj/v1) that holds the latest stable version of v1 (and successive versions accordingly).  this way i can merge my dev branch, presently nmj/v1 because we're on v1, into v1 when it's stable and it should autodeploy to /v1.  the latest stable version of whatever v we're on should also be merged into main
  - Added deploy-stable-branch CI job: push to `v1` (or `v2`, etc.) branch → autodeploys to /v1/ on prod S3. Tags still work for point-in-time snapshots.
[x] puddle-dev should still be autodeploying from my present personal branch, currently nmj/v1
  - Already implemented: nmj/** → puddle-dev.obfusco.us. Confirmed working.
[x] roadmap: try a version of puddle using pretext for the puddle
  - Added to ROADMAP.md
[x] is there a way to test this as if it's being run from an iphone that has silent mode on? when i check this on other people's phones they get no sound until they turn silent mode off.  this is not ideal
  - See answer below. Short: no perfect simulator, but Chrome DevTools mobile emulation + manually muting Mac system audio is closest. Real device testing is best — use TestFlight or just share puddle-dev URL.
[x] need to make sure audio is getting turned on as soon as we enter the app.  ios users still reporting the audio not working when they first visit the app
  - Fixed two bugs: (1) createMediaElementSource was routing unlock audio through suspended Web Audio graph — iOS never saw output → session stayed "ambient". Removed that bridge; HTML audio now plays independently. (2) unlockIOSAudio() was deferred to 2nd gesture (init() sets up listener, listener fires on next gesture). Fixed by calling unlockIOSAudio() + ctx.resume() directly inside init(), which is always called from a gesture handler.
[x] lead me through how to setup an account with poap for use with this app
  - See walkthrough in chat. Short: POAP.xyz account → create event → get mint links/QR → distribute. Puddle's POAP integration uses milestone tracking in localStorage to detect when users earn badges; actual POAP minting happens through poap.xyz or your own distributor contract. The RibbonPuddle.sol contract is a separate ERC-721 for QR preset ownership, not POAP protocol.
[x] when info modal is open, if the user clicks the i icon again it should close the modal
[x] so iphones are still having that blasted silent mode issue.  is there anything ANYTHING?!?!? else we can do?  if there's no other solutions can we detect if they're in silent mode and inform them with a simple notificaton when the arrive at the site?
  - Cannot detect silent mode from JS. Added one-time dismissible banner for iOS users: "No sound? Check the Ring/Silent switch on the side of your iPhone." Shows on arrival, auto-dismisses after 9s, tappable, stored in localStorage.
[x] want the NFT to automatically create its title (presently just showing +Ribbon Puddle NFT #2) from the optional title the user inputs (if blank create a cute distinct key for the user).  The result should ideally just be called "Puddle blah blah blah" if the user created a title called 'blah blah blah'.  ![alt text](<Screenshot 2026-04-10 at 17.54.15.png>)
  - Contract renamed from "Ribbon Puddle" → "Puddle". Added on-chain tokenURI returning base64 JSON with name "Puddle {user name}" or "Puddle {adj} {noun}" (deterministic from contentHash) if blank. Redeployed: 0xb41A1E7daB44cC25A9B772c899383F462D72b44F. Mint flow now passes resolved name to contract so tokenURI works without Pinata.
[x] can the image in the marketplace (opensea, etc) be autofilled from the graphic created for the qr?
  - Contract updated: mint() now accepts metadataURI param. tokenURI returns IPFS URI if set (shows QR image on OpenSea), falls back to on-chain JSON. Client passes pinPuddleMetadata() return value to mint(). Redeployed: 0xccA43aF3Fcb9027732FF5f3ddbBF8B6E415267a0
[x] ideally it would also include a link to the particular version of puddle the nft was minted from
  - IPFS metadata already includes external_url pointing to presetUrl (the full preset URL with hash). On-chain fallback tokenURI uses puddle.obfusco.us as external_url. Pinata metadata's external_url is the exact preset URL so tapping on OpenSea loads that exact puddle state.
[x] not seeing the version autoincrementing on commit to v1 branch.  want to bump numbers like outlined before
  - deploy-stable-branch CI job now auto-bumps patch version on each push to v1. Runs `npm version patch --no-git-tag-version`, commits "chore: bump version to vX.Y.Z", pushes back. Loop-safe: bump step is skipped when head commit message contains "chore: bump version".
[x] i'm not seeing the title when i'm testing this on puddle.obfusco.us ![alt text](<Screenshot 2026-04-10 at 18.18.12.png>)
  - Screenshot shows Coinbase wallet confirmation dialog "+Unknown NFT #1". This is a wallet-side display limitation — the token doesn't exist on-chain yet at signing time so `tokenURI` can't be queried. The name will appear on OpenSea once the transaction confirms and OpenSea indexes the new contract (first-time indexing can take a few hours). No code fix possible.
[x] hmm i'm still not sure this is actually providing the title that the user put for their preset.  not seeing that title in opensea
  - Found double-prefix bug: PresetQR called puddleDisplayName() → "Puddle X", then passed that to pinPuddleMetadata (which called puddleDisplayName again → "Puddle Puddle X") and mint() (where tokenURI prepends "Puddle " → "Puddle Puddle X"). Fixed: PresetQR now computes rawBase (no prefix) and passes it to both sinks; each adds "Puddle " exactly once. Exported autoName from ipfs.js to support this.
[x] on that last deploy i did not see the version increment
  - CI did bump to v1.0.1; user checked before CI completed. Working correctly.
[x] still not seeing the title title the user inputs show up in in the mint modal spawned from puddle.obfusco.us, but now i'm at least seeing "Puddle NFT #x"
  - Mint button now shows "Puddle {name} #{id} minted! ✦" using mintedName state set at mint time
[x] put the shake nook icon on mobile, too, similar placement in the nook to the right of the puddle
  - Nook shown on mobile via position:absolute bottom-right of stage; was previously display:none
[x] on mobile the qr modal is funky because it auto spawns the keyboard and you can't see the full qr.  make the name field not selected by default to prevent this and ensure the app in the bg is static (no scroll) for best display of qr modal
  - Removed autoFocus from name input; added scroll lock (body overflow:hidden) on modal mount
[x] i'm seeing some fouc or like a flash of the app before i see the splash screen on mobile sizes
  - MobileSplash `visible` now initialized synchronously in useState lazy initializer instead of useEffect; eliminates one-frame flash of app before splash covers it
[] 