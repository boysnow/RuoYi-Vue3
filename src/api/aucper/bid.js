import request from '@/utils/request'

// 查询商品入札情報列表
export function listBid(query) {
  return request({
    url: '/aucper/bid/list',
    method: 'get',
    params: query
  })
}

// 查询商品入札情報详细
export function getBid(id) {
  return request({
    url: '/aucper/bid/' + id,
    method: 'get'
  })
}

// 新增商品入札情報
export function addBid(data) {
  return request({
    url: '/aucper/bid',
    method: 'post',
    data: data
  })
}

// 修改商品入札情報
export function updateBid(data) {
  return request({
    url: '/aucper/bid',
    method: 'put',
    data: data
  })
}

// 删除商品入札情報
export function delBid(id) {
  return request({
    url: '/aucper/bid/' + id,
    method: 'delete'
  })
}