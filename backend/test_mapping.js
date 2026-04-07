const charset = '10 ';
for (let lum = 0; lum <= 255; lum += 15) {
  let idxFloor = Math.floor((lum / 255) * (charset.length - 1));
  let idxRound = Math.round((lum / 255) * (charset.length - 1));
  console.log(`lum: ${lum}, floor: ${charset[idxFloor]}, round: ${charset[idxRound]}`);
}
