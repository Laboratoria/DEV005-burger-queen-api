const paginate = (arr, page, limit) => {
  const totalItems = arr.length;
  const lastPage = Math.floor(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const currentPage = arr.slice(startIndex, endIndex);
  return {
    limit,
    pageData: currentPage,
    prev: page > 1 ? page - 1 : null,
    next: page < lastPage ? page + 1 : null,
    first: 1,
    last: lastPage,
    totalItems,
  };
};

module.exports = { paginate };
