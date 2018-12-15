import AV from 'leancloud-storage'
import fetch from 'dva/fetch'
import config from './config'

const { blog, pre, suf, open, closed } = config
const token = `access_token=${pre}${suf}`

// 状态检测
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) return response
  const error = new Error(response.statusText)
  error.response = response
  throw error
}

// 文章总数,一次获取全部文章，先以 200 做限制
export async function queryTotal() {
  try {
    const url = `${blog}/issues?${open}&page=1&per_page=200&${token}`
    const response = await fetch(url)
    checkStatus(response)
    const data = await response.json()
    return data
  } catch (err) {
    console.log(err)
  }
}

// 分类
export async function queryCats() {
  try {
    const url = `${blog}/milestones?${token}`
    const response = await fetch(url)
    checkStatus(response)
    const data = await response.json()
    return data
  } catch (err) {
    console.log(err)
  }
}

// 标签
export async function queryTags() {
  try {
    const url = `${blog}/labels?${token}`
    const response = await fetch(url)
    checkStatus(response)
    const data = await response.json()
    return data
  } catch (err) {
    console.log(err)
  }
}

// 筛选文章
export async function queryFilterPost({ type, filter }) {
  try {
    const url = `${blog}/issues?${type}=${filter}&${token}`
    const response = await fetch(url)
    checkStatus(response)
    const data = await response.json()
    return data
  } catch (err) {
    console.log(err)
  }
}

// 说说总数
export async function queryMoodTotal() {
  try {
    const url = `${blog}/issues?${closed}&labels=mood&page=1&per_page=200&${token}`
    const response = await fetch(url)
    checkStatus(response)
    const data = await response.json()
    return data
  } catch (err) {
    console.log(err)
  }
}

// 书单 && 友链 && 关于
export async function queryPage({ type }) {
  let upperType = type.replace(/^\S/, function(s) {
    return s.toUpperCase()
  })
  try {
    const url = `${blog}/issues?${closed}&labels=${upperType}&${token}`
    const response = await fetch(url)
    checkStatus(response)
    const data = await response.json()
    return data[0]
  } catch (err) {
    console.log(err)
  }
}

// 文章热度
export async function queryHot({ postList }) {
  return new Promise(resolve => {
    if (window.location.href.includes('http://localhost')) {
      resolve(postList)
    }
    const seq = postList.map(o => {
      return new Promise(resolve => {
        const query = new AV.Query('Counter')
        const Counter = AV.Object.extend('Counter')
        const { title, id } = o
        query.equalTo('id', id)
        query
          .find()
          .then(res => {
            if (res.length > 0) {
              // 已存在则返回热度
              const counter = res[0]
              o.times = counter.get('time')
              resolve(o)
            } else {
              // 不存在则新建
              const newcounter = new Counter()
              newcounter.set('title', title)
              newcounter.set('id', id)
              newcounter.set('time', 1)
              newcounter
                .save()
                .then(() => {
                  resolve(o)
                })
                .catch(console.error)
            }
          })
          .catch(console.error)
      }).catch(console.error)
    })

    Promise.all(seq)
      .then(data => {
        resolve(data)
      })
      .catch(console.error)
  }).catch(console.error)
}

// 增加热度
export async function queryPostHot({ post, add = true }) {
  return new Promise(resolve => {
    if (window.location.href.includes('http://localhost')) {
      add = false
    }
    const query = new AV.Query('Counter')
    const Counter = AV.Object.extend('Counter')
    const { title, id } = post
    query.equalTo('id', id)
    query
      .find()
      .then(res => {
        if (res.length > 0) {
          // 已存在则加热度
          const counter = res[0]
          counter
            .increment('time', add ? 1 : 0)
            .save(null, { fetchWhenSave: true })
            .then(counter => {
              post.times = counter.get('time')
              resolve(post)
            })
            .catch(console.error)
        } else {
          // 不存在则新建
          const newcounter = new Counter()
          newcounter.set('title', title)
          newcounter.set('id', id)
          newcounter.set('time', 1)
          newcounter
            .save()
            .then(() => {
              post.times = 1
              resolve(post)
            })
            .catch(console.error)
        }
      })
      .catch(console.error)
  }).catch(console.error)
}

// 喜欢小站
export async function likeSite(params) {
  return new Promise(resolve => {
    const query = new AV.Query('Counter')
    const Counter = AV.Object.extend('Counter')
    query.equalTo('title', 'site')
    query
      .first()
      .then(res => {
        if (res) {
          if (params && params.type === 'getTime') {
            resolve(res.get('time'))
          } else {
            res
              .increment('time', 1)
              .save(null, { fetchWhenSave: true })
              .then(counter => {
                resolve(counter.get('time'))
              })
              .catch(console.error)
          }
        } else {
          // 不存在则新建
          const newcounter = new Counter()
          newcounter.set('title', 'site')
          newcounter.set('time', 1)
          newcounter
            .save()
            .then(counter => {
              resolve(counter.get('time'))
            })
            .catch(console.error)
        }
      })
      .catch(console.error)
  }).catch(console.error)
}
