<template>
   <div class="app-container">
      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['aucper:bidhist:edit']"
            >変更</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['aucper:bidhist:remove']"
            >削除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
      <el-table
         v-loading="loading"
         :data="dataList"
         ref="datatable"
         style="width: 100%;"
         @selection-change="handleSelectionChange"
         :row-key="getRowKeys"
      >
        <el-table-column type="selection" width="40" align="center" :reserve-selection="true" />
        <el-table-column label="#" width="50" type="index" align="center">
            <template #default="scope">
               <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
            </template>
        </el-table-column>
        <el-table-column label="商品コード" align="center" width="120" prop="productCode" />
        <el-table-column label="タイトル" align="center" prop="productTitle" :show-overflow-tooltip="true" >
        </el-table-column>
        <el-table-column label="備考" align="center" width="70" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column align="center" width="100" prop="nowPrice">
            <template #header>
                現在価格<br>(税込)
            </template>
            <template #default="scope">
                <span style="font-weight: bold;">{{ new Intl.NumberFormat().format(scope.row.nowPrice) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="保留価格" align="center" width="100" prop="onholdPrice" />
        <el-table-column label="入札数" align="center" width="65" prop="bidUserCount" />
        <el-table-column label="入札終了日時" align="center" width="120" prop="bidEndDate" :show-overflow-tooltip="true" >
            <template #default="scope">
                <span>{{ parseTime(scope.row.bidEndDate, '{m}-{d} {h}:{i}') }}</span>
            </template>
        </el-table-column>
        <el-table-column label="残り時間" align="center" width="100" prop="remainingTime">
            <template #default="scope">
                <span v-if="scope.row.remainingTimeUnit != '-'" style="font-weight: bold;">{{ scope.row.remainingTime }}</span>
                <span >{{ scope.row.remainingTimeUnit }}</span>
            </template>
        </el-table-column>
        <el-table-column label="最後入札者" align="center" width="100" prop="bidLastUser"/>
        <el-table-column label="ステータス" align="center" width="100" prop="realStatus" >
            <template #default="scope">
               <dict-tag :options="auc_real_status" :value="scope.row.realStatus" />
            </template>
        </el-table-column>
        <el-table-column label="入札ユーザ１" align="center" width="105" prop="trusteeshipUser1" :show-overflow-tooltip="true" />
        <el-table-column label="入札ユーザ２" align="center" width="105" prop="trusteeshipUser2" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-tooltip content="変更" placement="top">
                  <el-button
                     type="text"
                     icon="Edit"
                     @click="handleUpdate(scope.row)"
                     v-hasPermi="['monitor:job:edit']"
                  ></el-button>
               </el-tooltip>
               <el-tooltip content="削除" placement="top">
                  <el-button
                     type="text"
                     icon="Delete"
                     @click="handleDelete(scope.row)"
                     v-hasPermi="['monitor:job:remove']"
                  ></el-button>
               </el-tooltip>
               <el-tooltip content="最新情報取得" placement="top">
                  <el-button
                     type="text"
                     icon="CaretRight"
                     @click="handleRun(scope.row)"
                     v-hasPermi="['monitor:job:changeStatus']"
                  ></el-button>
               </el-tooltip>
            </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0" 
        :total="total" 
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />


   </div>
</template>

<script setup name="Bidhist">
import { listBidhist as initData, getBidhist, updateBidhist, addBidhist, delBidhist } from "@/api/aucper/bidhist";

const { proxy } = getCurrentInstance();
const { auc_real_status, auc_task_kind } = proxy.useDict("auc_real_status", "auc_task_kind");

const dataList = ref([]);
const loading = ref(true);

const codes = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const open = ref(false);
const title = ref("");
const baseUrl = ref("");
const isEdit = ref(false);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productCode: undefined,
    taskKind: undefined,
    createBy: undefined,
    status: undefined
  },
  rules: {
    productCode: [{ required: true, message: "ID or URLが必須です", trigger: "blur" }],
    taskKind: [{ required: true, message: "ID or URLが必須です", trigger: "change" }]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询登录日志列表 */
function getList() {
//   loading.value = true;
  initData(queryParams.value).then(response => {
    // 値が変化あるかチェック
    let beforeData = dataList.value;
    dataList.value = response.rows;
    // 

    total.value = response.total;
    loading.value = false;
  });
}


getList();

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}
/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

function reset() {
  form.value = {
      taskKind: '0'
  };
  proxy.resetForm("bidRef");
}

function getRowKeys(row) {
    return row.productCode;
}

// 多选框选中数据
function handleSelectionChange(selection) {
  codes.value = selection.map(item => item.productCode);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}


function handleRun(row) {
  const codes = row.productCode;
  proxy.$modal.confirm('すぐ最新情報を取得しますが、よろしいですか？').then(function () {
    return forcedUpdate(codes);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("取得を依頼しました");
  }).catch(() => {});
}

function submitForm() {
  proxy.$refs["bidRef"].validate(valid => {
    if (valid) {
      //auctionIDがURLの場合、編集しておく
      form.value.productCode = form.value.productCode.replace(/\/$/, "").replace(/.*\//g, "");
      if (form.value.updateTime != undefined) {
        updateBid(form.value).then(response => {
          proxy.$modal.msgSuccess("保存しました");
          open.value = false;
          getList();
        });
      } else {
        addBid(form.value).then(response => {
          proxy.$modal.msgSuccess("保存しました");
          open.value = false;
          getList();
        });
      }
    }
  });
}
function cancel() {
  open.value = false;
  reset();
}

/** 强退按钮操作 */
function handleForceLogout(row) {
    proxy.$modal.confirm('是否确认强退名称为"' + row.userName + '"的用户?').then(function () {
  return forceLogout(row.tokenId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}




</script>
