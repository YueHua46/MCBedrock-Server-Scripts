const SECTION_SIGN="§",colorCodes={black:"0",darkBlue:"1",darkGreen:"2",darkAqua:"3",darkRed:"4",darkPurple:"5",gold:"6",gray:"7",darkGray:"8",blue:"9",green:"a",aqua:"b",red:"c",lightPurple:"d",yellow:"e",white:"f",minecoinGold:"g",materialQuartz:"h",materialIron:"i",materialNetherite:"j",obfuscated:"k",bold:"l",materialRedstone:"m",materialCopper:"n",italic:"o",materialGold:"p",materialEmerald:"q",reset:"r",materialDiamond:"s",materialLapis:"t",materialAmethyst:"u"};for(const a in colorCodes){const b=a;colorCodes[b]=SECTION_SIGN+colorCodes[b]}function createStylizer(t){return new Proxy((...e)=>[...t,...e].join(""),{get(e,r,a){var o=r,o=colorCodes[o];return o?createStylizer([...t,o]):Reflect.get(e,r,a)}})}const color=createStylizer([]);export{color};