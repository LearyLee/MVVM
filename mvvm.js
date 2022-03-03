class MVVM{

  constructor(options){
    // 一上来 先把可用的东西挂载在实例上
    this.$el = options.el;
    this.$data = options.data;

    // 如果有要编译的模板就开始编译
    if(this.$el){
      // 数据劫持 就是把对象的所有属性 改为get和set方法
      new Observer(this.$data);

      this.proxyData(this.$data);
      
      // 用数据和元素进行编译
      new Compile(this.$el, this);
    }
  }
  proxyData(data){
    Object.keys(data).forEach(key=>{
      Object.defineProperty(this, key, {
        get(){ // 当取值时调用的方法
         return data[key];
        },
        set(newValue){ // 当给data属性中设置值的时候 更改获取的属性的值
          data[key] = newValue;
        }
      });
    });
  }
  
}