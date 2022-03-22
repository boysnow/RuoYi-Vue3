import request from '@/utils/request'

// 查询商品入札情報列表
export function listBidlist(query) {
  return request({
    url: '/aucper/bidlist/list',
    method: 'get',
    params: query
  })
}

// 查询商品入札情報详细
export function getBidlist(id) {
  return request({
    url: '/aucper/bidlist/' + id,
    method: 'get'
  })
}

// 新增商品入札情報
export function addBidlist(data) {
  return request({
    url: '/aucper/bidlist',
    method: 'post',
    data: data
  })
}

// 修改商品入札情報
export function updateBidlist(data) {
  return request({
    url: '/aucper/bidlist',
    method: 'put',
    data: data
  })
}

// 删除商品入札情報
export function delBidlist(id) {
  return request({
    url: '/aucper/bidlist/' + id,
    method: 'delete'
  })
}