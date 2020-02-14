class Observer {

    // a subscriber is a function/method that will be called whenever notify is called
    constructor() {
        this.subscribers = [];
    }


    subscribe(x) {
        this.subscribers.push(x);
    }


    unsubscribe(x) {
        this.subscribers = this.subscribers.filter(subscriber => subscriber !== x);
    }


    notify(data) {
        this.subscribers.forEach(subscriber => subscriber(data));
    }
}