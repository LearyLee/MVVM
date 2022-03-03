class Compile{

  constructor(el, vm){
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if(this.el){  // 如果这个元素能获取到 我们才开始编译

      // 1.先把这些真实的DOM移入到内存中 fragment
      let fragment = this.node2fragment(this.el);

      // 2.编译 => 提取想要的元素节点 v-model 和 文本节点 {{}}
      this.compile(fragment);

      // 3.把编译好的fragment再塞回到页面里去
      this.el.appendChild(fragment);
    }
  }

  /* 专门写一些辅助的方法 */
  isElementNode(node){
    return node.nodeType === 1; // 元素
  }
  isTextNode(node){
    return node.nodeType === 3; // 文本
  }
  // 是不是指令
  isDirective(name){
    return name.includes('v-');
  }

  /* 核心的方法 */
  compile(fragment){
    let childNodes = fragment.childNodes;
    Array.from(childNodes).forEach(node => {
      if(this.isElementNode(node)){
        // 是元素节点，还需要继续深入的检查
        // 这里需要编译元素
        this.compileElement(node);
        // console.log('element', node);
        this.compile(node);
      }else if(this.isTextNode(node)){
        // 是文本节点
        // 这里需要编译文本
        this.compileText(node);
        // console.log('text', node);
      }
    });
  }

  compileElement(node){
    // 带 v-model v-text v-xxx
    let attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      // console.log(attr);
      // 判断属性名称是不是包含v-
      let attrName = attr.name;
      if(this.isDirective(attrName)){
        // 取到对应的值放到节点中
        let expr = attr.value;
        let type = attrName.slice(2); // 截取 v- 后面的部分
        // node this.vm.$data expr  // v-mode v-text v-html
        // todo ........
        CompileUtil[type](node, this.vm, expr);
      }
    })
    // console.log(attrs);
  }

  compileText(node){
    // 带 {{asd}}
    let expr = node.textContent;  //取文本中的内容
    let reg = /\{\{([^}]+)\}\}/g; // {{a}} {{b}} {{c}}
    if(reg.test(expr)){
      // node this.vm.$data expr
      // todo ........
        CompileUtil['text'](node, this.vm, expr);
    }
    // console.log(text);
  }

  node2fragment(el){  // 需要将el中的内容全部放到内存中
    // 文档碎片
    let fragment = document.createDocumentFragment();
    let firstChild;
    while(firstChild = el.firstChild){
      fragment.appendChild(firstChild);
    }
    return fragment;  // 内存中的节点
  }


}

CompileUtil = {
  setVal(vm, expr, value){
    expr = expr.split('.'); // [a,v,c,s,a,w,r]
    return expr.reduce((prev, next, currentIndex) => {  // vm.$data
      if(currentIndex == expr.length-1){
        return prev[next] = value;
      }
      return prev[next];
    }, vm.$data);
  },
  getVal(vm, expr){
    expr = expr.split('.'); // [a,v,c,s,a,w,r]
    return expr.reduce((prev, next) => {  // vm.$data
      return prev[next];
    }, vm.$data);
  },
  getTextVal(vm, expr){   // 获取编译文本后的结果
    return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
      // console.log(expr, arguments);
      return this.getVal(vm, arguments[1]);
    });
  },
  text(node, vm, expr){ // 文本处理
    let updateFn = this.updater['textUpdater'];
    let value = this.getTextVal(vm, expr);
    // 这里应该加一个监控 数据变化了 应该调用这个watch的callback
    // {{a}} {{b}}
    expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
      new Watcher(vm, arguments[1], ()=>{
        // 如果数据变化了，文本节点需要重新获取依赖的属性更新文本中的内容
        updateFn && updateFn(node, this.getTextVal(vm, expr));
      });
    });
    updateFn && updateFn(node, value);
  },
  model(node, vm, expr){  // 输入框处理
    let updateFn = this.updater['modelUpdater'];
    // 这里应该加一个监控 数据变化了 应该调用这个watch的callback
    new Watcher(vm, expr,(newVal)=>{
      // 当值变化后会调用cb 将新的值传递过来
      updateFn && updateFn(node, newVal);
    });
    node.addEventListener('input', (e) =>{
      let newValue = e.target.value;
      this.setVal(vm, expr, newValue);
    });
    updateFn && updateFn(node, this.getVal(vm, expr));
  },
  updater:{
    // 文本更新
    textUpdater(node, value){
      node.textContent = value
    },
    // 输入框更新
    modelUpdater(node, value){
      node.value = value
    }
  }
}