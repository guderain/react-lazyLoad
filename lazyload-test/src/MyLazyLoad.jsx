import {
    useEffect,
    useRef,
    useState
} from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
/*
`entries`参数是一个数组,数组中包含了所有被观察目标的IntersectionObserverEntry对象。每个IntersectionObserverEntry对象包含了以下属性:

1. `target`: 被观察的DOM元素
2. `intersectionRatio`: 目标元素与根元素(通常是视窗)的交叉比例,值在0-1之间。0表示完全不可见,1表示完全可见。
3. `boundingClientRect`: 目标元素的矩形信息,包括top、left、width、height等。
4. `intersectionRect`: 目标元素与根元素交叉部分的矩形信息。
5. `rootBounds`: 根元素(通常是视窗)的矩形信息。
6. `time`: 观察到交叉变化的时间戳。

所以在回调函数中遍历`entries`数组,就可以获取到每个被观察元素的详细信息。
*/ 
export const MyLazyLoad = (props)=>{
    MyLazyLoad.propTypes = {
        className: PropTypes.string,
        style: PropTypes.object,
        offset: PropTypes.number,
        width: PropTypes.string,
        onContentVisible: PropTypes.func,
        placeholder: PropTypes.node,
        height: PropTypes.string,
        children: PropTypes.node
    };
    // offset 距离到可视区域多远触发加载
    // onContentVisible 进入可视区域的回调
    const {
        className,
        style,
        offset,
        width,
        onContentVisible,
        placeholder,
        height,
        children
    } = props;
    // 外层div引用
    const containerRef = useRef(null);
    
    const elementObserver = useRef(null);
    const [visible, setVisible] = useState(false);
    const styles = {height, width, ...style};

    // entries 是必须的参数(不用手动传入)
    // entries是一个数组，数组中包含了所有被观察目标的IntersectionObserverEntry对象信息entry
    function lazyLoadHandler (entries) {
        // entry包含了目标元素的详细信息,有如下属性:isIntersecting/target/intersectionRatio/rootBounds/time/boundingClientRect/intersectionRect
        const [entry] = entries;
        const { isIntersecting } = entry;
        // 相交时触发回调并去掉监听
        if (isIntersecting) {
            setVisible(true);
            onContentVisible?.();
            // 去掉对当前dom的监听
            const node = containerRef.current;
            if (node && node instanceof HTMLElement) {
                elementObserver.current?.unobserve(node);
            }
        }
    }

    const debouncedHandler = debounce(lazyLoadHandler, 500);

    useEffect(()=>{
        const options = {
            rootMargin: typeof offset === 'number' ? `${offset}px` : offset || '0px', // 距离可视区域多远触发回调
            threshold: 0 // 0-1 之间的值，表示元素的多少部分进入可视区域时触发回调
        };
        // 创建IntersectionObserver 对象监听div是否进入可视区域
        // 参数1：可视区域回调函数，参数2配置项
        elementObserver.current = new IntersectionObserver(debouncedHandler,options);

        const node = containerRef.current;
        if(node){
            // 开始监听dom并执行lazyLoadHandler回调
            elementObserver.current.observe(node);
        }
        return ()=>{
            if(node){
                elementObserver.current?.unobserve(node);
            }
        }
    },[])

    return(
        <div ref={containerRef} className={className} style={styles}>
            {visible ? children : placeholder}
        </div>
    )
}
