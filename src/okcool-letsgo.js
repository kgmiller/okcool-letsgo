const urlParser = require("url")
const OkCoolHoldThis = require('okcool-holdthis')

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
    
    if (routeParts.length == 0) {
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
      return {
        action: action,
        params: {}  
      }
    }
    
    //url = urlParser.parse(url)
    var urlParts = url.split('/').filter((up) => up != '')
    var urlPartsLength = urlParts.length
    
    if (urlParts.length == 0) {
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
