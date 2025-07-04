import { Fragment, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import InnerContainer from "../../components/ui/InnerContainer";
import Paginate from "../../components/ui/Paginate";
import UserContainer from "../../components/ui/UserContainer";
import { useFetchAllToursQuery } from "../../redux/apis/tourApi";
import InputSelect from "../../components/ui/InputSelect";
import Loader from "../../components/ui/Loader";
import IconFilter from "../../components/ui/IconFilter";
import OverviewFilterModal from "../../components/tour-details/OverviewFilterModal";
import ManageTourItem from "../../components/management-details/ManageTourItem";
import Meta from "../../components/ui/Meta";
import { setAlert } from "../../redux/slices/userSlice";

export default function ManageTours() {
  const [modal, setModal] = useState(false);
  const [sort, setSort] = useState("");
  const [filter, setFilter] = useState({ difficulty: "", rating: "0" });
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { isLoading, error, data } = useFetchAllToursQuery(
    {
      sort,
      difficulty: filter.difficulty,
      [`ratingsAverage[gte]`]: filter.rating,
      page,
      limit: 8,
    },
    { refetchOnMountOrArgChange: true }
  );

  useEffect(() => {
    if (error) dispatch(setAlert({ type: "error", msg: error }));
  }, [error, dispatch]);

  const inputHandler = (e) => {
    setFilter((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  let content;
  if (isLoading) {
    content = <Loader />;
  } else if (data) {
    const tours = data.data.tours;

    content = (
      <div>
        <div className="manage-top">
          <div className="manage-queries">
            <p>Total: {data.total}</p>
            <p>
              Page: {page} ({data.results} results)
            </p>
          </div>
          <div className="manage-queries">
            <IconFilter filter={filter} onClick={() => setModal(true)} />
            <InputSelect type="sort" onChange={(e) => setSort(e.target.value)}>
              <option value="">Newest</option>
              <option value="price">Price Low to High</option>
              <option value="-price">Price High to Low</option>
              <option value="ratingsAverage">Rating Low to High</option>
              <option value="-ratingsAverage">Rating High to Low</option>
              <option value="-ratingsQuantity">More Reviews</option>
            </InputSelect>
            <Link to="/manage/tours/create" className="btn-secondary center">
              + Create Tour
            </Link>
          </div>
        </div>
        <div className="table-header tours-table-grid">
          <p>Name</p>
          <p>Lead Guide</p>
          <p>Duration </p>
          <p>Price</p>
          <p>Actions</p>
        </div>
        <div className="line line-xs">&nbsp;</div>

        {tours.length > 0 ? (
          tours.map((el) => (
            <Fragment key={el._id}>
              <ManageTourItem tour={el} />
              <div className="line line-xs">&nbsp;</div>
            </Fragment>
          ))
        ) : (
          <p style={{ fontSize: "1.6rem" }}>No results</p>
        )}
      </div>
    );
  }

  return (
    <UserContainer>
      <InnerContainer className="manage-view__inner-container">
        <Meta
          title="Manage tours | TravelPulse"
          description="Create, edit and delete tours in TravelPulse"
        />

        {modal && (
          <OverviewFilterModal
            inputHandler={inputHandler}
            onCancel={() => setModal(false)}
            filter={filter}
          />
        )}

        {content}

        {data && (
          <Paginate
            currentBtn={page}
            setCurrentBtn={setPage}
            pages={Math.ceil(data?.total / 8)}
            filter={filter}
            sort={sort}
          />
        )}
      </InnerContainer>
    </UserContainer>
  );
}
