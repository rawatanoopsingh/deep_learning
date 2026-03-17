// arch_diagrams.js — Architecture view
// Transformer: loads 3 reference SVGs (N=2 overview, encoder detail, decoder detail)
// CNN: loads SVG files (N=3 overview, block detail) + D3-drawn interactive overview

function loadSvgSection(container, file, title){
  var sec=document.createElement('div');
  sec.style.cssText='margin-bottom:24px';
  var ttl=document.createElement('div');
  ttl.style.cssText='font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#A8A29E;margin-bottom:8px;padding-left:4px';
  ttl.textContent=title;
  sec.appendChild(ttl);
  var frame=document.createElement('div');
  frame.style.cssText='border:1px solid var(--bd,#E7E5E0);border-radius:12px;overflow:hidden;background:#1C1917';
  var obj=document.createElement('object');
  obj.data=file;
  obj.type='image/svg+xml';
  obj.style.cssText='width:100%;display:block';
  obj.addEventListener('load',function(){
    try{
      var doc=obj.contentDocument;
      if(!doc)return;
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
          else if(label.includes('conv2d')||label.includes('conv block'))tid='CNN.CONVOLUTION';
          else if(label.includes('batchnorm'))tid='TRANSFORMER.LAYER_NORM';
          else if(label.includes('relu'))tid='FOUNDATIONS.ACTIVATIONS';
          if(tid){
            g.style.cursor='pointer';
            rect.style.cursor='pointer';
            g.addEventListener('click',function(){sT(tid)});
          }
        }
      });
    }catch(e){}
  });
  frame.appendChild(obj);
  sec.appendChild(frame);
  container.appendChild(sec);
}

function drawTransformerArch(){
  var ct=document.getElementById('arch-transformer');
  var svgs=[
    {file:'artifacts/diagrams/transformer_N2_fully_expanded.svg', title:'N=2 Overview — 2 encoder blocks + 2 decoder blocks'},
    {file:'artifacts/diagrams/encoder_block_level1_detail.svg', title:'Encoder Block Detail — matrix dimensions, h=2 heads'},
    {file:'artifacts/diagrams/decoder_block_level2_detail.svg', title:'Decoder Block Detail — 3 sub-layers with matrix dimensions'}
  ];
  svgs.forEach(function(s){ loadSvgSection(ct, s.file, s.title); });
}

function drawCNNArch(){
  var ct=document.getElementById('arch-cnn');

  // Section 1: Load CNN block detail SVG (dark theme, matches transformer style)
  loadSvgSection(ct, 'artifacts/diagrams/cnn_block_detail.svg', 'Conv Block Detail — im2col, variance, FIR interpretation');

  // Section 2: D3-drawn N=3 interactive overview
  var sec=document.createElement('div');
  sec.style.cssText='margin-bottom:24px';
  var ttl=document.createElement('div');
  ttl.style.cssText='font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#A8A29E;margin-bottom:8px;padding-left:4px';
  ttl.textContent='N=3 Overview — 3 blocks, hierarchical features (interactive)';
  sec.appendChild(ttl);
  var svgContainer=document.createElement('div');
  svgContainer.id='cnn-d3-container';
  sec.appendChild(svgContainer);
  ct.appendChild(sec);

  // D3 drawing
  var w=560, svgH=780;
  var svg=d3.select('#cnn-d3-container').append('svg').attr('class','arch-svg').attr('viewBox','0 0 '+w+' '+svgH).style('background','#1C1917').style('border-radius','12px');
  svg.append('defs').append('marker').attr('id','ca').attr('viewBox','0 0 10 10').attr('refX',8).attr('refY',5).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M2 1L8 5L2 9').attr('fill','none').attr('stroke','#9C9A92').attr('stroke-width',1.5);

  var C={bg:'rgb(68,68,65)',border:'rgb(180,178,169)',text:'rgb(180,178,169)',title:'rgb(250,249,245)',dim:'rgb(194,192,182)',arrow:'rgb(156,154,146)',green:'rgb(151,196,89)',orange:'rgb(239,159,39)',purple:'rgb(175,169,236)',groupBg:'rgba(151,196,89,0.08)',groupStroke:'rgba(151,196,89,0.4)'};
  var F='"Anthropic Sans",-apple-system,system-ui,sans-serif';

  function box(x,y,bw,bh,label,ac,tid,sub){
    var g=svg.append('g').style('cursor',tid?'pointer':'default');
    if(tid)g.on('click',function(){sT(tid)});
    g.append('rect').attr('x',x).attr('y',y).attr('width',bw).attr('height',bh).attr('rx',6).attr('fill',C.bg).attr('stroke',ac||C.border).attr('stroke-width',.5);
    g.append('text').attr('x',x+bw/2).attr('y',y+bh/2+(sub?-5:1)).attr('text-anchor','middle').attr('dominant-baseline','central').attr('font-size',12).attr('font-weight',400).attr('fill',ac||C.text).attr('font-family',F).text(label);
    if(sub)g.append('text').attr('x',x+bw/2).attr('y',y+bh/2+9).attr('text-anchor','middle').attr('font-size',9).attr('fill',C.dim).attr('font-family',F).text(sub);
  }
  function ar(x1,y1,x2,y2){svg.append('line').attr('x1',x1).attr('y1',y1).attr('x2',x2).attr('y2',y2).attr('stroke',C.arrow).attr('stroke-width',1.5).attr('marker-end','url(#ca)')}
  function lb(x,y,t){svg.append('text').attr('x',x).attr('y',y).attr('text-anchor','end').attr('font-size',10).attr('fill',C.dim).attr('font-family','Courier New,monospace').text(t)}
  function note(x,y,t){svg.append('text').attr('x',x).attr('y',y).attr('font-size',10).attr('fill','rgba(194,192,182,0.5)').attr('font-style','italic').attr('font-family',F).text(t)}

  var cx=210, BW=170;
  svg.append('text').attr('x',w/2).attr('y',22).attr('text-anchor','middle').attr('font-size',14).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('CNN — 3 blocks, hierarchical features');
  svg.append('text').attr('x',w/2).attr('y',38).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.dim).attr('font-family',F).text('Click any block to open topic. Each block: Conv \u2192 BN \u2192 ReLU \u2192 Pool.');

  box(cx-BW/2,50,BW,28,'Input image',C.border);
  lb(cx-BW/2-8,68,'[B, C, H, W]');
  ar(cx,78,cx,94);

  function cnnBlk(y0,idx,desc,wl,dout){
    var bh=140;
    svg.append('rect').attr('x',cx-BW/2-14).attr('y',y0).attr('width',BW+28).attr('height',bh).attr('rx',10).attr('fill',C.groupBg).attr('stroke',C.groupStroke).attr('stroke-width',1);
    svg.append('text').attr('x',cx).attr('y',y0+16).attr('text-anchor','middle').attr('font-size',10).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('Block '+idx+' \u2014 '+desc);
    var y=y0+24;
    box(cx-BW/2,y,BW,28,'Conv2d (k=3, s=1, p=1)',C.green,'CNN.CONVOLUTION',wl);
    note(cx+BW/2+12,y+10,'\u2190 learned FIR');
    ar(cx,y+28,cx,y+34); y+=34;
    box(cx-BW/2+14,y,BW-28,24,'BatchNorm',C.border,'TRANSFORMER.LAYER_NORM');
    ar(cx,y+24,cx,y+30); y+=30;
    box(cx-BW/2+20,y,BW-40,24,'ReLU',C.purple,'FOUNDATIONS.ACTIVATIONS');
    ar(cx,y+24,cx,y+30); y+=30;
    box(cx-BW/2+20,y,BW-40,22,'MaxPool 2\u00d72',C.orange);
    lb(cx-BW/2-16,y+14,dout);
    return y0+bh;
  }

  var y=94;
  y=cnnBlk(y,1,'edges, frequencies','W\u2081 \u2208 [C\u2081,C,3,3]','[B,C\u2081,H/2,W/2]');
  ar(cx,y,cx,y+8); y+=8;
  y=cnnBlk(y,2,'textures, parts','W\u2082 \u2208 [C\u2082,C\u2081,3,3]','[B,C\u2082,H/4,W/4]');
  ar(cx,y,cx,y+8); y+=8;
  y=cnnBlk(y,3,'objects, patterns','W\u2083 \u2208 [C\u2083,C\u2082,3,3]','[B,C\u2083,H/8,W/8]');
  ar(cx,y,cx,y+8); y+=8;

  box(cx-BW/2+10,y,BW-20,24,'Global Average Pool',C.orange);
  lb(cx-BW/2-16,y+14,'[B, C\u2083]');
  note(cx+BW/2+12,y+10,'\u2190 spatial \u2192 1');
  ar(cx,y+24,cx,y+34); y+=34;

  var hg=svg.append('g').style('cursor','pointer').on('click',function(){sT('HYBRID.CNN_TRANSFORMER')});
  hg.append('rect').attr('x',cx-BW/2-4).attr('y',y).attr('width',BW+8).attr('height',26).attr('rx',6).attr('fill','rgba(151,196,89,0.05)').attr('stroke',C.green).attr('stroke-width',.8).attr('stroke-dasharray','5 3');
  hg.append('text').attr('x',cx).attr('y',y+16).attr('text-anchor','middle').attr('font-size',10).attr('font-weight',500).attr('fill',C.green).attr('font-family',F).text('\u2192 Transformer (features become tokens)');
  note(cx+BW/2+12,y+14,'optional hybrid');
  ar(cx,y+26,cx,y+36); y+=36;

  box(cx-BW/2+15,y,BW-30,26,'Linear \u2192 Softmax',C.border);
  lb(cx-BW/2-16,y+14,'[B, V]');
  ar(cx,y+26,cx,y+40);
  svg.append('text').attr('x',cx).attr('y',y+54).attr('text-anchor','middle').attr('font-size',12).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('Output class probabilities');

  // Notes
  var nY=y+76;
  svg.append('line').attr('x1',20).attr('y1',nY).attr('x2',w-20).attr('y2',nY).attr('stroke','rgba(222,220,209,0.3)').attr('stroke-width',.5);
  svg.append('text').attr('x',w/2).attr('y',nY+18).attr('text-anchor','middle').attr('font-size',11).attr('font-weight',500).attr('fill',C.title).attr('font-family',F).text('Key observations');
  ['Conv = constrained matrix multiply (im2col). Same weights at every spatial position.',
   'ReLU prevents cascade collapse: without it, N conv layers = 1 conv layer.',
   'Hierarchy: Block 1 = edges/frequencies. Block 2 = textures. Block 3 = objects.',
   'Variance: Xavier 1/(k\u00b2C), Kaiming 2/(k\u00b2C). Same philosophy as 1/\u221ad\u2096 in attention.',
   'Weight sharing \u2192 parameter-efficient. But NOT FLOP-efficient: k\u00b2\u00b7C\u2092\u2099\u00b7C\u2092\u1d64\u1d57\u00b7HW per layer.'
  ].forEach(function(t,i){svg.append('text').attr('x',30).attr('y',nY+38+i*18).attr('font-size',10).attr('fill',C.dim).attr('font-family',F).text(t)});
}
