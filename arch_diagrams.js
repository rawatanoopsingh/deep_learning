// arch_diagrams.js — Architecture view
// Transformer: loads 3 reference SVGs directly (N=2 overview, encoder detail, decoder detail)
// CNN: D3-drawn interactive diagram

function drawTransformerArch(){
  var ct=document.getElementById('arch-transformer');
  var svgs=[
    {file:'artifacts/diagrams/transformer_N2_fully_expanded.svg', title:'N=2 Overview — 2 encoder blocks + 2 decoder blocks'},
    {file:'artifacts/diagrams/encoder_block_level1_detail.svg', title:'Encoder Block Detail — matrix dimensions, h=2 heads'},
    {file:'artifacts/diagrams/decoder_block_level2_detail.svg', title:'Decoder Block Detail — 3 sub-layers with matrix dimensions'}
  ];
  svgs.forEach(function(s){
    var sec=document.createElement('div');
    sec.style.cssText='margin-bottom:24px';
    var title=document.createElement('div');
    title.style.cssText='font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#A8A29E;margin-bottom:8px;padding-left:4px';
    title.textContent=s.title;
    sec.appendChild(title);
    var frame=document.createElement('div');
    frame.style.cssText='border:1px solid var(--bd,#E7E5E0);border-radius:12px;overflow:hidden;background:#1C1917';
    var obj=document.createElement('object');
    obj.data=s.file;
    obj.type='image/svg+xml';
    obj.style.cssText='width:100%;display:block';
    // Make blocks clickable: inject click handlers after load
    obj.addEventListener('load',function(){
      try{
        var doc=obj.contentDocument;
        if(!doc)return;
        // Add click listeners to all rect+text groups that could be topic links
        var gs=doc.querySelectorAll('g');
        gs.forEach(function(g){
          var rect=g.querySelector('rect');
          var txt=g.querySelector('text');
          if(rect&&txt){
            var label=(txt.textContent||'').toLowerCase();
            var tid=null;
            if(label.includes('self-attention')||label.includes('self attention'))tid='TRANSFORMER.SELF_ATTENTION';
            else if(label.includes('cross-attention')||label.includes('cross attention'))tid='TRANSFORMER.CROSS_ATTENTION';
            else if(label.includes('masked'))tid='TRANSFORMER.MASKING';
            else if(label.includes('layer norm'))tid='TRANSFORMER.LAYER_NORM';
            else if(label.indexOf('ffn')>=0||label.includes('feed-forward'))tid='TRANSFORMER.FFN';
            else if(label.includes('embedding'))tid='FOUNDATIONS.EMBEDDINGS';
            else if(label.includes('softmax')&&label.includes('linear'))tid=null; // output head, no topic
            if(tid){
              g.style.cursor='pointer';
              rect.style.cursor='pointer';
              g.addEventListener('click',function(){sT(tid)});
            }
          }
        });
      }catch(e){/* cross-origin if not served from same origin */}
    });
    frame.appendChild(obj);
    sec.appendChild(frame);
    ct.appendChild(sec);
  });
}


// ============================================================================
// CNN ARCHITECTURE — D3-drawn, matching the SVG reference style (dark theme)
// ============================================================================
function drawCNNArch(){
  var w=560, svgH=880;
  var svg=d3.select('#arch-cnn').append('svg').attr('class','arch-svg').attr('viewBox','0 0 '+w+' '+svgH).style('background','#1C1917').style('border-radius','12px');
  svg.append('defs').append('marker').attr('id','ca').attr('viewBox','0 0 10 10').attr('refX',8).attr('refY',5).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M2 1L8 5L2 9').attr('fill','none').attr('stroke','#9C9A92').attr('stroke-width',1.5);

  // Dark theme colors matching the reference SVGs
  var C={
    bg:'rgb(68,68,65)',       // block bg
    border:'rgb(180,178,169)',// block border
    text:'rgb(180,178,169)',  // block text
    title:'rgb(250,249,245)', // headings
    dim:'rgb(194,192,182)',   // dim labels
    arrow:'rgb(156,154,146)', // arrows
    green:'rgb(151,196,89)',  // encoder/conv accent
    orange:'rgb(239,159,39)', // cross-attn / pool accent
    purple:'rgb(175,169,236)',// attention accent
    groupBg:'rgba(151,196,89,0.08)', // block group fill
    groupStroke:'rgba(151,196,89,0.4)'
  };
  var F='\"Anthropic Sans\",-apple-system,system-ui,sans-serif';

  function box(x,y,bw,bh,label,accentColor,tid,sub){
    var g=svg.append('g').style('cursor',tid?'pointer':'default');
    if(tid)g.on('click',function(){sT(tid)});
    g.append('rect').attr('x',x).attr('y',y).attr('width',bw).attr('height',bh).attr('rx',6).attr('fill',C.bg).attr('stroke',accentColor||C.border).attr('stroke-width',.5);
    g.append('text').attr('x',x+bw/2).attr('y',y+bh/2+(sub?-5:1)).attr('text-anchor','middle').attr('dominant-baseline','central').attr('font-size',12).attr('font-weight',400).attr('fill',C.text).attr('font-family',F).text(label);
    if(sub)g.append('text').attr('x',x+bw/2).attr('y',y+bh/2+9).attr('text-anchor','middle').attr('font-size',9).attr('fill',C.dim).attr('font-family',F).text(sub);
  }
  function ar(x1,y1,x2,y2){svg.append('line').attr('x1',x1).attr('y1',y1).attr('x2',x2).attr('y2',y2).attr('stroke',C.arrow).attr('stroke-width',1.5).attr('marker-end','url(#ca)')}
  function lb(x,y,t,anchor){svg.append('text').attr('x',x).attr('y',y).attr('text-anchor',anchor||'end').attr('font-size',11).attr('fill',C.dim).attr('font-family','Courier New,monospace').text(t)}
  function note(x,y,t){svg.append('text').attr('x',x).attr('y',y).attr('font-size',10).attr('fill','rgba(194,192,182,0.6)').attr('font-style','italic').attr('font-family',F).text(t)}

  var cx=210, BW=170;

  svg.append('text').attr('x',w/2).attr('y',22).attr('text-anchor','middle').attr('font-size',14).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('CNN Architecture — 3 blocks, hierarchical features');

  // Input
  box(cx-BW/2,40,BW,30,'Input image',C.border);
  lb(cx-BW/2-8,58,'[B, C, H, W]');
  ar(cx,70,cx,86);

  // Conv block helper
  function cnnBlk(y0, idx, desc, wLabel, dimOut){
    var bh=148;
    svg.append('rect').attr('x',cx-BW/2-14).attr('y',y0).attr('width',BW+28).attr('height',bh).attr('rx',10).attr('fill',C.groupBg).attr('stroke',C.groupStroke).attr('stroke-width',1);
    svg.append('text').attr('x',cx).attr('y',y0+16).attr('text-anchor','middle').attr('font-size',10).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('Block '+idx+' — '+desc);
    var y=y0+24;

    // Conv2d
    box(cx-BW/2,y,BW,30,'Conv2d (k=3, s=1, p=1)',C.green,'CNN.CONVOLUTION',wLabel);
    note(cx+BW/2+12, y+12, '\u2190 learned FIR filter');
    ar(cx,y+30,cx,y+38); y+=38;

    // BatchNorm
    box(cx-BW/2+14,y,BW-28,26,'BatchNorm',C.border,'TRANSFORMER.LAYER_NORM');
    note(cx+BW/2+12, y+12, '\u2190 variance control');
    ar(cx,y+26,cx,y+34); y+=34;

    // ReLU
    box(cx-BW/2+20,y,BW-40,26,'ReLU',C.purple,'FOUNDATIONS.ACTIVATIONS');
    note(cx+BW/2+12, y+12, '\u2190 prevents cascade collapse');
    ar(cx,y+26,cx,y+34); y+=34;

    // MaxPool
    box(cx-BW/2+20,y,BW-40,24,'MaxPool 2\u00d72',C.orange);
    note(cx+BW/2+12, y+10, '\u2190 spatial decimation \u00f72');
    lb(cx-BW/2-16, y+16, dimOut);
    return y0+bh;
  }

  var y=86;
  y=cnnBlk(y, 1, 'edges, frequencies', 'W\u2081 \u2208 [C\u2081,C,3,3]', '[B,C\u2081,H/2,W/2]');
  ar(cx,y,cx,y+10); y+=10;
  y=cnnBlk(y, 2, 'textures, parts', 'W\u2082 \u2208 [C\u2082,C\u2081,3,3]', '[B,C\u2082,H/4,W/4]');
  ar(cx,y,cx,y+10); y+=10;
  y=cnnBlk(y, 3, 'objects, patterns', 'W\u2083 \u2208 [C\u2083,C\u2082,3,3]', '[B,C\u2083,H/8,W/8]');
  ar(cx,y,cx,y+10); y+=10;

  // Global avg pool
  box(cx-BW/2+10,y,BW-20,26,'Global Average Pool',C.orange);
  lb(cx-BW/2-16, y+16, '[B, C\u2083]');
  note(cx+BW/2+12, y+12, '\u2190 spatial dims \u2192 1');
  ar(cx,y+26,cx,y+36); y+=36;

  // Hybrid handoff (dashed)
  var hg=svg.append('g').style('cursor','pointer').on('click',function(){sT('HYBRID.CNN_TRANSFORMER')});
  hg.append('rect').attr('x',cx-BW/2-4).attr('y',y).attr('width',BW+8).attr('height',28).attr('rx',6).attr('fill','rgba(151,196,89,0.05)').attr('stroke',C.green).attr('stroke-width',.8).attr('stroke-dasharray','5 3');
  hg.append('text').attr('x',cx).attr('y',y+17).attr('text-anchor','middle').attr('font-size',11).attr('font-weight',500).attr('fill',C.green).attr('font-family',F).text('\u2192 Transformer (features become tokens)');
  note(cx+BW/2+12, y+17, 'optional hybrid path');
  ar(cx,y+28,cx,y+38); y+=38;

  // Classifier head
  box(cx-BW/2+15,y,BW-30,28,'Linear \u2192 Softmax',C.border);
  lb(cx-BW/2-16, y+16, '[B, V]');
  ar(cx,y+28,cx,y+42);
  svg.append('text').attr('x',cx).attr('y',y+56).attr('text-anchor','middle').attr('font-size',12).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('Output class probabilities');

  // === DETAIL SECTION ===
  var detY = y + 80;
  svg.append('line').attr('x1',20).attr('y1',detY).attr('x2',w-20).attr('y2',detY).attr('stroke','rgba(222,220,209,0.3)').attr('stroke-width',.5);
  svg.append('text').attr('x',w/2).attr('y',detY+20).attr('text-anchor','middle').attr('font-size',12).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('What to see here');

  var notes2=['Conv = constrained matrix multiply (Toeplitz/im2col). Y = W \u00b7 X_patches.',
    'Nonlinearity (ReLU) between layers prevents cascade collapse: without it, N conv layers = 1.',
    'Hierarchical: Block 1 = edges. Block 2 = textures from edges. Block 3 = objects from textures.',
    'Variance control: Xavier Var(w) = 1/(k\u00b2C_in), Kaiming: 2/(k\u00b2C_in). Same idea as 1/\u221adₖ.',
    'Weight sharing: same kernel at every spatial position \u2192 parameter-efficient + cache-friendly.'];
  notes2.forEach(function(t,i){svg.append('text').attr('x',30).attr('y',detY+42+i*20).attr('font-size',10).attr('fill',C.dim).attr('font-family',F).text(t)});
}
