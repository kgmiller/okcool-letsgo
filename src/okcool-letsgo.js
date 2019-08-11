var urlParser = require("url")

class Node {
  constructor() {
    this.action = null
    this.route = null
    this.branches = {
      static: {},
      regex: {},
      parameter: null
    }
  }  
}

module.exports = class OkCoolLetsGo {
  constructor() {
    this.root = new Node
    this.cache = new OkCoolHoldThis()
  }
  
  add(route, action) {
    
    if (!route.startsWith('/')) {
      route = `/${route}`
    }
    
    var routeParts = route.split('/').filter((rp) => rp != '')
    
    if (routeParts === []) {
      this.root.value = action
    }
    else {
      var currentNode = this.root
      
      for (const [i, rp] of routeParts.entries()) {
        var isParam = rp.startsWith(":") || rp.startsWith("?:")
        
        var nextPartOptional = false
        if (i < (routeParts.length - 1)) {          
          nextPartOptional = routeParts[i+1].startsWith("?")
        }
        
        if (currentNode.branches.static[rp] == undefined && !isParam) {
          var newNode = new Node()
          currentNode.branches.static[rp] = newNode
          
          if (i == (routeParts.length - 1) || nextPartOptional) {
            currentNode.branches.static[rp].action = action
            currentNode.branches.static[rp].route = route
          }
          else {
            currentNode = currentNode.branches.static[rp]
          }
        }
        else if (isParam) {
          if (!currentNode.branches.parameter) {
            currentNode.branches.parameter = new Node()
          }
            
          if (i == (routeParts.length - 1) || nextPartOptional) {
            currentNode.branches.parameter.action = action
            currentNode.branches.parameter.route = route
          }
          else {
            currentNode = currentNode.branches.parameter
          }          
        }
        else {
          if (i == (routeParts.length - 1)) {
            currentNode.value = action
          }
          else {
            currentNode = currentNode.branches.static[rp]
          }
        }
      }
    }
  }
  
  find(url) {    
    let action = this.cache.get(url)
    if (action) {
      return action
    }
    
    //url = urlParser.parse(url)
    var urlParts = url.split('/').filter((up) => up != '')
    var urlPartsLength = urlParts.length
    
    if (urlParts === []) {
      return {
        action: this.root.value,
        params: {}  
      }
    }
    else {
      var currentNode = this.root
      var i = 0
      
      for(const up of urlParts) {
        //if (up == '') {
        //  continue
        //}
        
        if (currentNode.branches.static[up]) {
          if (i == (urlPartsLength - 1) && currentNode.branches.static[up].action) {
            let route = currentNode.branches.static[up].route

            this.extractParams(url, route)
            
            this.cache.trySet(url, currentNode.branches.static[up].action)
            
            return {
              action: currentNode.branches.static[up].action,
              params: this.params
            }
          }
          else if (i < (urlPartsLength - 1)) {
            currentNode = currentNode.branches.static[up]
          }
        }
        else if (currentNode.branches.parameter) {
          
          if (i == (urlPartsLength - 1) && currentNode.branches.parameter.action) { 
            let route = currentNode.branches.parameter.route
            
            this.cache[url] = currentNode.branches.parameter.action
            
            this.extractParams(url, route)
            
            this.cache.trySet(url, currentNode.branches.parameter.action)
            
            return {
              action: action = currentNode.branches.parameter.action,
              params: this.params
            }
          }
          else if (i < (urlPartsLength - 1)) {
            currentNode = currentNode.branches.parameter
          }
        }
        i++
      }
    }
    
    return null
  }
  
  extractParams(url, route) {
    this.params = {}
    return
    
    var query = url.query
    
    if (query) {
      var queryParams = query.split('&').filter((qp) => qp != '').map((qp) => qp.split('=').filter((qp) => qp != ''))
      
      for (const qp of queryParams) {
        if (qp.length == 2) {
          this.params[qp[0]] = qp[1]
        }
      }      
    }
    
    var routeParts = route.split('/').filter((rp) => rp != '')
    var urlParts = url.pathname.split('/').filter((up) => up != '')
    
    for (var i = 0; i < urlParts.length; i++) {  
      if (routeParts[i].startsWith(':') || routeParts[i].startsWith('?:')) {
        this.params[routeParts[i].replace(':', '').replace('?','')] = urlParts[i]
      }
    }
  }
  
  print(node = null, depth = 1) {
    if (node == null) {
      node = this.root
    }
    
    if (node.value) {
      console.log('-'.repeat(depth) + 'Route Action: ' + node.value.toString())
    }
    else {
      console.log('-'.repeat(depth) + 'Route Action: None')
    }
    
    for (const k of Object.keys(node.branches.static)) {
      console.log('-'.repeat(depth) + 'Route Part: ' + k.toString())
      let newDepth = depth + 1
      this.print(node.branches.static[k], newDepth)
    }
    if (node.branches.parameter) {
      console.log('-'.repeat(depth) + 'Route Part: URL Parameter')
      let newDepth = depth + 1
      this.print(node.branches.parameter, newDepth)
    }
  }
  
}

class OkCoolHoldThis {
  constructor(maxItems = 50000) {
    this.maxItems = maxItems
    this.currentItems = 0
    this.cache = {}
    this.frequencyList = new FrequencyList()
    this.newAccessAverage = .0001
  }
  
  trySet(key, value, accessCount = 0, firstAccess = 0) {
    
    if (this.currentItems == this.maxItems) {
      if (accessCount == 0 && this.frequencyList.tail.frequency > this.newAccessAverage) {
        return false
      }
      if ((accessCount / (lastAccess - firstAccess)) > this.frequencyList.tail.frequency) {
        this.delete(this.frequencyList.tail.value)
        this.set(key, value, accessCount, firstAccess)
      }  
    }
    else {
      this.set(key, value, accessCount, firstAccess)
    }
    
    this.currentItems++
    
    return true
  }
  
  set(key, value, accessCount, firstAccess) {
    if (accessCount == 0) {
      accessCount == 1
      firstAccess = Date.now()
      var lastAccess = firstAccess + 1000
    }
    
    var node = this.frequencyList.add(key, accessCount, firstAccess, lastAccess)
    
    this.cache[key] = {
      value: value,
      frequencyNode: node
    }
  }
  
  get(key) {
    var value = this.cache[key]
    
    if (value) {
      value.frequencyNode.accessCount++
      value.frequencyNode.lastAccess = Date.now()
      
      if (!value.frequencyNode.isHead && value.frequencyNode.averageFrequency() > value.frequencyNode.previous.averageFrequency(value.frequencyNode.lastAccess)) {
        //this.frequencyList.promote(value.frequencyNode)
      }
      else if (!value.frequencyNode.isTail && value.frequencyNode.averageFrequency() < value.frequencyNode.next.averageFrequency(value.frequencyNode.lastAccess)) {
        //this.frequencyList.demote(value.frequencyNode)
      }
    }
    else {
      return null
    }
    
    return value.value
  }
}


class FrequencyList {
  constructor() {
    this.head = new FrequencyListNode()
    this.head.isHead = true
    
    this.tail = new FrequencyListNode(this.head, null)
    this.tail.isTail = true
    
    this.head.previous = null
    this.head.next = this.tail
  }
  
  add(key, accessCount, firstAccess, lastAccess) {
    var newNode = new FrequencyListNode(this.tail, null)
    this.tail.isTail = false
    newNode.isTail = true
    this.tail.next = newNode
    this.tail = newNode
    this.tail.accessCount = accessCount
    this.tail.firstAccess = firstAccess
    this.tail.lastAccess = lastAccess
    this.tail.value = key
    return this.tail
  }
  
  promote(node) {    
    var oldNext = node.next
    node.next = node.previous
    node.next.next = oldNext
    node.previous = node.next.previous
    node.next.previous = node
    node.isHead = node.next.isHead
    node.next.isHead = false
    node.next.isTail = node.isTail
    node.isTail = false
    
    if (node.isHead) {
      this.head = node
    }
  }
  
  demote(node) {
    
    var oldPrevious = node.previous
    node.previous = node.next
    node.next = node.previous.next
    node.previous.next = node
    node.previous.previous = oldPrevious
    node.isTail = node.previous.isTail
    node.previous.isTail = false
  }
}

class FrequencyListNode {
  constructor(previous = null, next = null) {
    this.value = {}
    this.accessCount = 0
    this.firstAccess = 0
    this.lastAccess = 0
    this.previous = previous
    this.next = null
    this.isHead = false
    this.isTail = false
  }
  
  averageFrequency(lastAccess = null) {
    if (this.lastAccess == 0 || this.firstAccess == 0) {
      return 0
    }
    
    if (!lastAccess) {
      var lastAccess = this.lastAccess
    }
    
    return this.accessCount / (lastAccess - this.firstAccess)
  }
}

//var router = new OkCoolLetsGo()
//router.add('/hello', '/hello')
//router.add('/hello/world', '/hello/world')
//router.add('/hello/alexis', '/hello/alexis')
//router.add('/hello/alexis/:action', '/hello/alexis/:action')
//router.add('/hello/:someone', '/hello/:someone')
//router.add('/run/?:where', '/run/?:where')

//router.print()

//console.log(router.find('/hello/world'))
//console.log(router.find('/hello/world'))
//console.log(router.find('/hello/world'))
//console.log(router.find('/hello/world'))
//console.log(router.find('/hello/world'))
//console.log(router.find('/hello/world'))
//console.log(router.find('/hello/river'))

//route = router.getRoute('/hello/river?foo=bar&this=that&somenumber=25')
//console.log(route.params.somenumber)
