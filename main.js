// Minimal 2048 implementation (4x4)
(function(){
  const size = 4;
  let grid = [];
  let score = 0;
  const gridEl = document.getElementById('grid');
  const scoreEl = document.getElementById('score');
  document.getElementById('newBtn').addEventListener('click', newGame);

  function initGrid(){
    grid = [];
    for(let r=0;r<size;r++){
      grid[r]=[];
      for(let c=0;c<size;c++) grid[r][c]=0;
    }
  }
  function render(){
    gridEl.innerHTML='';
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        const cell = document.createElement('div');
        cell.className='cell';
        const val = grid[r][c];
        if(val!==0){
          const tile = document.createElement('div');
          tile.className='tile';
          tile.textContent = val;
          tile.style.background = pickBg(val);
          cell.appendChild(tile);
        }
        gridEl.appendChild(cell);
      }
    }
    scoreEl.textContent = 'Score: '+score;
  }
  function pickBg(n){
    const map = {
      2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',
      64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'
    };
    return map[n] || '#3c3a32';
  }
  function randEmpty(){
    const empties=[];
    for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(grid[r][c]===0) empties.push([r,c]);
    if(empties.length===0) return null;
    return empties[Math.floor(Math.random()*empties.length)];
  }
  function addRandom(){
    const pos = randEmpty();
    if(!pos) return false;
    grid[pos[0]][pos[1]] = Math.random()<0.9?2:4;
    return true;
  }
  function newGame(){
    initGrid();
    score=0;
    addRandom(); addRandom();
    render();
  }
  // move helpers
  function rotateCW(mat){
    const n = size;
    const out = Array.from({length:n},()=>Array(n).fill(0));
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) out[c][n-1-r]=mat[r][c];
    return out;
  }
  function moveLeft(){
    let moved=false;
    for(let r=0;r<size;r++){
      let row = grid[r].filter(x=>x!==0);
      for(let i=0;i<row.length-1;i++){
        if(row[i]===row[i+1]){
          row[i]*=2;
          score += row[i];
          row.splice(i+1,1);
        }
      }
      while(row.length<size) row.push(0);
      for(let c=0;c<size;c++){
        if(grid[r][c]!==row[c]) moved=true;
        grid[r][c]=row[c];
      }
    }
    return moved;
  }
  function move(dir){ // 0=left,1=up,2=right,3=down
    let rotated=0;
    if(dir===1){ grid = rotateCW(grid); rotated=1; }
    else if(dir===2){ grid = rotateCW(rotateCW(grid)); rotated=2; }
    else if(dir===3){ grid = rotateCW(rotateCW(rotateCW(grid))); rotated=3; }
    const moved = moveLeft();
    // rotate back
    for(let i=0;i<rotated;i++) grid = rotateCW(grid);
    if(moved){
      addRandom();
      render();
      if(isGameOver()) setTimeout(()=>alert('Game Over! Score: '+score),50);
    }
  }
  function isGameOver(){
    for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(grid[r][c]===0) return false;
    for(let r=0;r<size;r++) for(let c=0;c<size-1;c++) if(grid[r][c]===grid[r][c+1]) return false;
    for(let c=0;c<size;c++) for(let r=0;r<size-1;r++) if(grid[r][c]===grid[r+1][c]) return false;
    return true;
  }
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft') move(0);
    else if(e.key==='ArrowUp') move(1);
    else if(e.key==='ArrowRight') move(2);
    else if(e.key==='ArrowDown') move(3);
  });
  // init
  newGame();
})();
