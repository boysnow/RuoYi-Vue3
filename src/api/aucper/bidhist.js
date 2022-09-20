import request from '@/utils/request'

// 查询商品入札履歴列表
export function listBidhist(query) {
  return request({
    url: '/aucper/bidhist/list',
    method: 'get',
    params: query
  })
}

// 查询商品入札履歴详细
export function getBidhist(id) {
  return request({
    url: '/aucper/bidhist/' + id,
    method: 'get'
  })
}

// 新增商品入札履歴
export function addBidhist(data) {
  return request({
    url: '/aucper/bidhist',
    method: 'post',
    data: data
  })
}

// 修改商品入札履歴
export function updateBidhist(data) {
  return request({
    url: '/aucper/bidhist',
    method: 'put',
    data: data
  })
}

// 删除商品入札履歴
export function delBidhist(id) {
  return request({
    url: '/aucper/bidhist/' + id,
    method: 'delete'
  })
}
