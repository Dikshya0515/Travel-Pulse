import "./TourPictures.css";
import { getTourImageUrl } from "../../utils/imageUtils";

export default function TourPictures({ pictures, name }) {
  return (
    <section className="section-pictures">
      {pictures.map((pic, index) => (
        <div key={index} className="picture-box">
          <img
            className={`picture-box__img picture-box__img--${index + 1}`}
            // src={`/img/tours/${pic}`}
            src={pic ? getTourImageUrl(pic) : '/img/tours/default.jpg'}
            alt={`${name} ${index + 1}`}
          />
        </div>
      ))}
    </section>
  );
}
