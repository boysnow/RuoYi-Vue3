<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
         <el-form-item label="登录地址" prop="productCode">
            <el-input
               v-model="queryParams.productCode"
               placeholder="请输入登录地址"
               clearable
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="用户名称" prop="taskStatus">
            <el-input
               v-model="queryParams.taskStatus"
               placeholder="请输入用户名称"
               clearable
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>

      
      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button
               type="primary"
               plain
               icon="Plus"
               @click="handleAdd"
               v-hasPermi="['aucper:bid:add']"
            >新規</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['aucper:bid:edit']"
            >変更</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['aucper:bid:remove']"
            >削除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
      <el-table
         v-loading="loading"
         :data="dataList.slice((queryParams.pageNum - 1) * queryParams.pageSize, queryParams.pageNum * queryParams.pageSize)"
         style="width: 100%;"
         :cell-class-name="changeBgColor"
         :row-style="rowBgColor"
      >
        <!-- <template #scope="scope"> -->
        <el-table-column label="#" width="50" type="index" align="center">
            <template #default="scope">
               <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
            </template>
        </el-table-column>
        <el-table-column label="商品コード" align="center" width="120" prop="productCode" >
            <template #default="scope">
                <a :href="'https://page.auctions.yahoo.co.jp/jp/auction/' + scope.row.productCode" target="_blank">{{ scope.row.productCode }}</a>
            </template>
        </el-table-column>
        <el-table-column label="タイトル" align="center" width="400" prop="productTitle" :show-overflow-tooltip="true" />
        <el-table-column label="現在価格" align="center" width="100" prop="nowPrice" />
        <el-table-column label="保留価格" align="center" width="100" prop="onholdPrice" />
        <el-table-column label="入札数" align="center" width="60" prop="bidUserCount" />
        <el-table-column label="入札終了日時" align="center" width="160" prop="bidEndDate" :show-overflow-tooltip="true" >
            <template #default="scope">
                <span>{{ parseTime(scope.row.bidEndDate) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="最後入札者" align="center" prop="bidLastUser" :show-overflow-tooltip="true" />
        <el-table-column label="托管ユーザ１" align="center" prop="trusteeshipUser1" :show-overflow-tooltip="true" />
        <el-table-column label="托管ユーザ２" align="center" prop="trusteeshipUser2" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button
                  type="text"
                  icon="Delete"
                  @click="handleForceLogout(scope.row)"
                  v-hasPermi="['monitor:online:forceLogout']"
               >强退</el-button>
            </template>
        </el-table-column>
        <!-- </template> -->
      </el-table>

      <pagination
         v-show="total > 0"
         :total="total"
         v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize"
         @pagination="getList"
      />

      <!-- 添加或修改公告对话框 -->
      <el-dialog :title="title" v-model="open" width="780px" append-to-body>
         <el-form ref="bidRef" :model="form" :rules="rules" label-width="80px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="商品ID" prop="productCode">
                     <el-input v-model="form.productCode" placeholder="商品コード" />
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="状態">
                     <el-radio-group v-model="form.taskStatus">
                        <el-radio
                           v-for="dict in sys_job_status"
                           :key="dict.value"
                           :label="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">確定</el-button>
               <el-button @click="cancel">取消</el-button>
            </div>
         </template>
      </el-dialog>


   </div>
</template>

<script setup name="Bid">
import { listBid as initData, updateBid, addBid } from "@/api/aucper/bid";

const { proxy } = getCurrentInstance();
const { sys_job_status } = proxy.useDict("sys_job_status");

const dataList = ref([]);
const loading = ref(true);
const total = ref(0);
const open = ref(false);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productCode: undefined,
    taskStatus: undefined
  },
  rules: {
    productCode: [{ required: true, message: "商品コードが必須です", trigger: "blur" }],
    taskStatus: [{ required: true, message: "商品コードが必須です", trigger: "change" }]
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
    dataList.value.map(newrow => {
        // レコード特定
        let oldrow = undefined;
        beforeData.some(o => {
            if (o.productCode === newrow.productCode) {
                oldrow = o;
                return true;
            }
            return false;
        });

        newrow.productCode_changed = true;
        newrow.productTitle_changed = true;
        newrow.nowPrice_changed = true;
        newrow.onholdPrice_changed = true;
        newrow.bidUserCount_changed = true;
        newrow.bidEndDate_changed = true;
        newrow.bidLastUser_changed = true;
        newrow.trusteeshipUser1_changed = true;
        newrow.trusteeshipUser2_changed = true;
        newrow.loginTime_changed = true;

        if (oldrow !== undefined) {
            if (oldrow.productCode === newrow.productCode) {
                newrow.productCode_changed = false;
            }
            if (oldrow.productTitle === newrow.productTitle) {
                newrow.productTitle_changed = false;
            }
            if (oldrow.nowPrice === newrow.nowPrice) {
                newrow.nowPrice_changed = false;
            }
            if (oldrow.onholdPrice === newrow.onholdPrice) {
                newrow.onholdPrice_changed = false;
            }
            if (oldrow.bidUserCount === newrow.bidUserCount) {
                newrow.bidUserCount_changed = false;
            }
            if (oldrow.bidEndDate === newrow.bidEndDate) {
                newrow.bidEndDate_changed = false;
            }
            if (oldrow.bidLastUser === newrow.bidLastUser) {
                newrow.bidLastUser_changed = false;
            }
            if (oldrow.trusteeshipUser1 === newrow.trusteeshipUser1) {
                newrow.trusteeshipUser1_changed = false;
            }
            if (oldrow.trusteeshipUser2 === newrow.trusteeshipUser2) {
                newrow.trusteeshipUser2_changed = false;
            }
            if (oldrow.loginTime === newrow.loginTime) {
                newrow.loginTime_changed = false;
            }
        }
    });


    total.value = response.total;
    loading.value = false;
  });
}
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
      taskStatus: 0
  };
  proxy.resetForm("bidRef");
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = "新規登録";
}
function submitForm() {
  proxy.$refs["bidRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        updateBid(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addBid(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
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

getList();


let timerId = setInterval(() => {
   getList();
}, 5000);


function changeBgColor({row, column}) {
    if (column.property === "productCode") {
        if (row.productCode_changed) return "animate-red-bg";
    }
    if (column.property === "productTitle") {
        if (row.productTitle_changed) return "animate-red-bg";
    }
    if (column.property === "nowPrice") {
        if (row.nowPrice_changed) return "animate-red-bg";
    }
    if (column.property === "onholdPrice") {
        if (row.onholdPrice_changed) return "animate-red-bg";
    }
    if (column.property === "bidUserCount") {
        if (row.bidUserCount_changed) return "animate-red-bg";
    }
    if (column.property === "bidEndDate") {
        if (row.bidEndDate_changed) return "animate-red-bg";
    }
    if (column.property === "bidLastUser") {
        if (row.bidLastUser_changed) return "animate-red-bg";
    }
    if (column.property === "trusteeshipUser1") {
        if (row.trusteeshipUser1_changed) return "animate-red-bg";
    }
    if (column.property === "trusteeshipUser2") {
        if (row.trusteeshipUser2_changed) return "animate-red-bg";
    }
    if (column.property === "loginTime") {
        if (row.loginTime_changed) return "animate-red-bg";
    }
}

function rowBgColor({row, rowIndex}) {
    if (row.bidStatus === "2") {
        return "background-color: silver";
    }
}

onUnmounted(() => {
   clearInterval(timerId);
})


</script>
