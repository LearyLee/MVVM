// 观测者的目的就是给需要变化的那个元素增加一个观察者，当数据变化后执行对应的方法
class Watcher{
  constructor(vm, expr, cb){
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    // 先获取一下原来的值
    this.value = this.get();
  }
  getVal(vm, expr){
    expr = expr.split('.'); // [a,v,c,s,a,w,r]
    return expr.reduce((prev, next) => {  // vm.$data
      return prev[next];
    }, vm.$data);
  }
  get(){
    Dep.target = this;
    let value = this.getVal(this.vm, this.expr);
    Dep.target = null;
    return value;
  }
  // 对外暴露的方法
  update(){
    let newValue = this.getVal(this.vm, this.expr);
    let oldValue = this.value;
    if(newValue != oldValue){
      this.cb(newValue, oldValue);  // 对应watch的callback
    }
  }

}
// 用新值和原来的值进行比较 如果发生变化 就调用更新方法
// vm.$data expr
/*
<input type="text" v-model="message" />
{ message: 1 }
{ message: 2 }
input.value = message
*/