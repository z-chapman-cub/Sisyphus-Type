

(async()=> {//Async to wait for fetch
  //Map goal string index to difficulty display
  const difficulties = ["Class One", "Class Two", "Class Three", "Class Four", "Class Five", "Class Six"];

  const promise = fetch("/text").then(r => r.text()).then(text => JSON.parse(text))//Fetch strings
  const goalString = await promise;//Wait for fetch

  const lineSet = generateLines();

  const viewport = document.getElementById("view");
  const svgNS = "http://www.w3.org/2000/svg";

  //Current goal string index and letter index
  let level = 0;
  let letter = 0;

  //Window coordinates to change view as type
  let prevX = null;
  let prevY = null;
  let currentX = 0;
  let currentY = 0;

  //Process user input
  window.addEventListener("keydown", function (event) {
    const textbox = document.getElementById("userinput");
    const currentWord = goalString[level];

    if(event.key === currentWord[letter]) {//Validate letter typed
      textbox.textContent += event.key;

      //Select the current letter so we can get its position
      const currChar = document.getElementById(`polyletter-${letter}`);
      if(currChar) {
        //Make character you finish red
        currChar.setAttribute("fill", "#892c25");

        //we have the current letters position now
        const currX = parseFloat(currChar.getAttribute("x"));
        const currY = parseFloat(currChar.getAttribute("y"));

        //we use its position to move the viewport by the appropriate amount
        //so from your perspective the words are moving and your view is stationary
        if(prevX !== null && prevY !== null) {
          const dx = currX - prevX;
          const dy = currY - prevY;
          currentX += dx;
          currentY += dy;
          requestAnimationFrame(() => centerOn(currentX, currentY));
        } else {
          currentX = currX;
          currentY = currY;
          requestAnimationFrame(() => centerOn(currentX, currentY));
        }

        prevX = currX;
        prevY = currY;

        updateProgress()//Update percent complete counter
      }

      letter++;
      document.activeElement.blur();

      if(textbox.textContent.length === currentWord.length) {//Reach end of goal string
        // result.textContent = "You May Proceed";
        stopTimer();
        let next = document.getElementById("nextButton")
        next.style.visibility = 'visible'
        next.removeAttribute('disabled')

        document.getElementById('one').style.visibility = 'visible'
        updateProgress()
      }
    }else if(event.key === "Backspace") {//Backspace undo a letter
      event.preventDefault();
      if(letter > 0) {
        letter--;
        textbox.textContent = textbox.textContent.slice(0, -1);

        const currChar = document.getElementById(`polyletter-${letter}`);
        if(currChar) {
          //Undo red coloring
          currChar.setAttribute("fill", "#433125");

          const currX = parseFloat(currChar.getAttribute("x"));
          const currY = parseFloat(currChar.getAttribute("y"));
          requestAnimationFrame(() => centerOn(currX, currY));

          prevX = currX;
          prevY = currY;
          currentX = currX;
          currentY = currY;

          updateProgress()//Update percent complete counter
        }
      }
    }
  });

  //Generate a set of points for the polyline that the letters are attached to for each level
  function generateLines() {
    const lineSet = [];
    const numRows = goalString.length;
    //Decrement value; change to inc later start from 0
    xMax = 50000;
    //set a high starting y so it can be decremented by a lot (terrain rise, cant use negative y)
    const yStart = 50000;
    const yEnd = 0;

    //go through each row
    for (let r = 0; r < numRows; r++) {
      if(r>2){xMax=70000}
      const pts = [];
      pts.push([0, yStart]);

      //set a fixed amount that each x is apart from each other and randomize it later
      const baseStepX = 160;
      //decrease the x spacing as rows increase to "increase the difficulty"
      const rowFactor = 1 - (r / numRows) * 0.7;
      const stepX = baseStepX * rowFactor;

      let currentX = 0;
      let prevY = yStart;
      //now take these static x and y differences and change them
      while (currentX < xMax) {
        const xOffset = (Math.random() - 0.5) * stepX * 0.3;
        currentX += stepX + xOffset;
        if(currentX >= xMax) break;

        const progress = currentX / xMax;

        const targetY = yStart - progress * (yStart - yEnd);

        const yOffsetRange = 400;
        const driftTowardTarget = (targetY - prevY) * 0.3;
        const randomDown = -Math.random() * yOffsetRange * 0.5;
        const randomJitter = (Math.random() - 0.5) * yOffsetRange * 0.3;

        let y = prevY + driftTowardTarget + randomDown + randomJitter;

        y = Math.max(yEnd, Math.min(yStart, y));

        //add pair to current points
        pts.push([Math.round(currentX), Math.round(y)]);
        prevY = y;
      }

      pts.push([xMax, yEnd]);
      lineSet.push(pts)
    }
    return lineSet;
  }

  //Restart the current level
  function Restart() {
    letter = 0;
    prevX = null;
    prevY = null;
    currentX = 0;
    currentY = 0;

    //we have to set the userinput window, level, result, etc to starting values
    const result = document.getElementById("result");
    const textbox = document.getElementById("userinput");
    const lvl = document.getElementById("level");
    result.textContent = "";
    textbox.textContent = "";

    lvl.textContent = difficulties[level];

    //again moving the viewport (but this time to the inital j since j==0)
    const currChar = document.getElementById(`polyletter-${letter}`);
    const currX = parseFloat(currChar.getAttribute("x"));
    const currY = parseFloat(currChar.getAttribute("y"));

    requestAnimationFrame(() => centerOn(currX, currY));
    document.getElementById("display")?.remove();

    viewport.querySelectorAll("svg").forEach(svg => svg.remove());

    Timer()
    getPolyline()
  }

  //Proceed to the next goal string
  function nextChallenge() {
    const result = document.getElementById("result");
    const textbox = document.getElementById("userinput");
    const lvl = document.getElementById("level");

    result.textContent = "";
    textbox.textContent = "";

    level++;
    letter = 0;
    prevX = null;
    prevY = null;

    lvl.textContent = difficulties[level];

    viewport.querySelectorAll("svg").forEach(svg => svg.remove());

    document.getElementById("display")?.remove();

    Timer()//Reset the timer
    getPolyline()//Create a new set of lines
  }

  //flag to allow timer update interruptions
  let timerActive = true;

  function Timer() {
    timerActive = true;
    //creating and positioning the element
    const display = document.createElement("p");
    display.setAttribute("id", "display");
    display.style.position = "absolute";
    display.style.top = "110px";
    display.style.left = "50%";
    display.style.transform = "translate(-50%, -50%)";
    display.style.fontSize = "60px";
    display.style.color = "#892c25";
    document.body.appendChild(display);

    //save the start time to continuously calculate the timer
    const start = performance.now();
    //updating the time constantly with requestanimationframe
    function update(now) {
      if(!timerActive) return;
      //get how long it has been since start time we saved
      const diff = (now - start) / 1000;
      //cut off decimals
      display.textContent = diff.toFixed(0);
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
  //halt update loop on complete a level to display result time
  function stopTimer() {
    timerActive = false;
  }

  //Create important elements on the page
  function Embed() {
    const lvl = document.getElementById("level");
    lvl.textContent = difficulties[level];
    lvl.style.position = "absolute";
    lvl.style.left = '50%';
    lvl.style.transform = 'translateX(-50%)'
    lvl.style.top = "0px";

    const res = document.getElementById("restartButton");
    res.style.position = "absolute";
    res.style.left = '100px';
    res.style.transform = 'translateX(-50%)'
    res.style.top = '5px';

    document.getElementById("restartButton").addEventListener('click',()=> {
      Restart()
      updateProgress()
    })

    let next = document.getElementById("nextButton")
    next.addEventListener("click", () => {
      next.setAttribute('disabled','')
      next.style.visibility = 'hidden'

      document.getElementById('one').style.visibility = 'hidden'
      nextChallenge()
    });

    next.style.position = "absolute";
    next.style.right = '-75px';
    next.style.transform = 'translateX(-50%)'
    next.style.top = '5px';
    next.setAttribute('disabled','')
    next.style.visibility = 'hidden'

    progressCounter()
  }

  //Create percentage completion counter in top left
  function progressCounter(){
    const progress = document.getElementById("progress");
    progress.style.width = '500'
    progress.style.height = '130'

    //% SVG
    const percent = document.createElementNS(svgNS, "svg");
    const textp = document.createElementNS(svgNS, 'text')

    progress.style.position = "absolute";
    progress.style.top = "150px";
    progress.style.left = "160px";

    textp.setAttribute('font-size','80')
    textp.setAttribute("fill", "#433125");
    textp.textContent = '%'

    percent.appendChild(textp)

    //Hidden 1 for 100%
    const one = document.createElementNS(svgNS, "svg");
    one.setAttribute("id", 'one');
    const texto = document.createElementNS(svgNS, 'text')

    texto.setAttribute('font-size','80')
    texto.setAttribute("fill", "#433125");
    texto.textContent = '1'
    one.style.left = "-150px";

    one.appendChild(texto)

    progress.appendChild(percent);
    progress.appendChild(one);

    one.style.visibility = 'hidden'

    //Digits in format %00
    const digits = Array.from({length: 2}, () => {//Digit -> which of 3 -> digit/text
      return Array.from({length: 3}, () => {
        digit = document.createElementNS(svgNS, "svg")
        text = document.createElementNS(svgNS, 'text')
        digit.appendChild(text)
        return {digit,text}
      })
    })

    for(let i = 0; i < 2; i++) {
      const digit = digits[i][1]['digit']
      const text = digits[i][1]['text']

      text.setAttribute('font-size','80')
      text.textContent = '0'
      text.setAttribute("fill", "#433125");
      digit.style.left += `${-100+50*i}px`

      digit.style.position = 'absolute'

      digit.appendChild(text)
      progress.appendChild(digit);
    }

    //Cycle digits in and out like rotation
    function updateProgress(){
      let percentComplete = (letter/goalString[level].length)*100;

      //For now just show values instead of animate
      for(let i = 1; i >= 0; i--) {
        const digit = digits[i][1]['digit']
        const text = digits[i][1]['text']

        // digit.style.transition = 'transform 1000ms linear'
        // digit.style.transform = `translate(${300}px, ${300}px)`

        let val = Math.floor(percentComplete%10)
        text.textContent = Math.floor(percentComplete%10)

        // if(val){
        //   text.setAttribute("fill", "#892c25");
        // }else{
        //   text.setAttribute("fill", "#433125");
        // }

        percentComplete/=10
      }
    }
    window.updateProgress = updateProgress;
  }

  //Create a polyline and attach the letters to it
  function getPolyline() {
    const svg = document.createElementNS(svgNS, "svg");
    const poly = document.createElementNS(svgNS, "polyline");

    svg.setAttribute("width", "3000");
    svg.setAttribute("height", "2000");
    svg.style.overflow = "visible";

    poly.setAttribute("points", lineSet[level]);
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "#433125");
    poly.setAttribute("stroke-width", "12");

    svg.appendChild(poly);//Add polyline to SVG
    viewport.appendChild(svg);

    svg.style.position = "absolute";

    function centerOn(x, y) {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;

      svg.style.transition = 'transform 100ms linear'
      svg.style.transform = `translate(${-(x - vw / 2)}px, ${-(y - vh / 2)}px)`;
    }
    window.centerOn = centerOn;

  //attach the letters to the polyline
  //space them evenly and rotate so that the bottom the letter is parallel
  //with where it is being place on the polyline
  function attachTextAbovePolyline(level, spacing, offsetAbove) {
    let textString = goalString[level]
    let pts = lineSet[level]

    function segLen(a, b) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      return Math.hypot(dx, dy);
    }
    const segLens = pts.slice(1).map((p, i) => segLen(pts[i], p));

    let acc=0
    function pointAtDistance(d) {
      next = false

      let remain = d;
      for (let i = 0; i < pts.length - 1; i++) {
        const len = segLens[i];

        if(remain <= len + acc) {
          const a = pts[i], b = pts[i + 1];
          const t = remain / len;
          x = a[0] + t * (b[0] - a[0]);
          y = a[1] + t * (b[1] - a[1]);
          const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);

          if(next){
            acc+=(angle-prevAngle)*30
            x-=acc*Math.cos(angle)
            y-=acc*Math.sin(angle)
            prevAngle = angle
            init = false
          }

          return { x, y, angle };
        }else {
          next = true
        }
        remain -= len;
      }
    }
    let prevAngle = 0
    let startOffset = 25;

    for (let i = 0; i < textString.length; i++) {
      const dist = startOffset + i * spacing;

      const { x, y, angle } = pointAtDistance(dist);

      const nx = -Math.sin(angle);
      const ny =  Math.cos(angle);
      const px = x + nx * offsetAbove;
      const py = y + ny * offsetAbove;

      //append the current letter
      const letter = document.createElementNS(svgNS, "text");
      letter.textContent = textString[i];
      letter.setAttribute("x", px);
      letter.setAttribute("y", py);
      letter.setAttribute("font-family", "segoe script");
      letter.setAttribute("font-size", "60");
      letter.setAttribute("text-anchor", "middle");
      letter.setAttribute("dominant-baseline", "middle");
      letter.setAttribute("transform", `rotate(${angle * 180 / Math.PI}, ${px}, ${py})`);
      letter.setAttribute("id", `polyletter-${i}`);
      letter.setAttribute("fill", "#433125");

      svg.appendChild(letter);
    }
  }
    //Place the goal string letters on the polyline
    attachTextAbovePolyline(level, 30, -30);
    //Select the first letter and center the view on it
    const currChar = document.getElementById(`polyletter-${letter}`);
    const currX = parseFloat(currChar.getAttribute("x"));
    const currY = parseFloat(currChar.getAttribute("y"));
    centerOn(currX, currY);
  }

  Embed()
  //generate the typing image
  getPolyline()
  //instantiate and update the timer
  Timer()
})();